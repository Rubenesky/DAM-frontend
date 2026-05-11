# Async Queue System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Gemini metadata generation and duplicate detection to a background job so uploads return in ~2s instead of ~8s, with frontend polling until processing completes.

**Architecture:** Cloudinary upload stays synchronous. After saving the asset with `status=pending`, `ProcessAssetAI` job is dispatched to run Gemini + duplicate detection in background. Frontend polls `GET /api/assets/{id}/status` every 3s until `processed` or `failed`.

**Tech Stack:** Laravel Queue `database` driver, Supabase `jobs` table (migration already exists), Vue 3 polling with `setInterval`

---

## File Map

### Backend (`c:/xampp/htdocs/dam-platform`)
- **Modify:** `app/Jobs/ProcessAssetAI.php` — implement the job (currently empty stub)
- **Modify:** `app/Http/Controllers/Api/AssetApiController.php` — dispatch job, remove sync AI calls
- **Modify:** `routes/api.php` — add `GET /assets/{asset}/status` endpoint
- **Modify:** `render.yaml` — add `QUEUE_CONNECTION=database` + queue worker to start command

### Frontend (`c:/xampp/htdocs/dam-frontend`)
- **Modify:** `src/views/AssetUploadView.vue` — add polling after upload

---

## Task 1: Configure queue driver and Render start command

**Files:**
- Modify: `render.yaml`

- [ ] **Step 1: Add QUEUE_CONNECTION and update startCommand in render.yaml**

Read `render.yaml` first. Then make two changes:

Add to `envVars`:
```yaml
      - key: QUEUE_CONNECTION
        value: database
```

Change `startCommand` to:
```yaml
    startCommand: php artisan serve --host=0.0.0.0 --port=$PORT & php artisan queue:work --timeout=60 --tries=3 --sleep=3
```

- [ ] **Step 2: Commit**

```bash
cd c:/xampp/htdocs/dam-platform
git add render.yaml
git commit -m "feat: configure database queue driver and start queue worker on Render"
```

---

## Task 2: Implement ProcessAssetAI job

**Files:**
- Modify: `app/Jobs/ProcessAssetAI.php`

- [ ] **Step 1: Replace entire file content**

Replace `c:/xampp/htdocs/dam-platform/app/Jobs/ProcessAssetAI.php` with:

```php
<?php

namespace App\Jobs;

use App\Models\Asset;
use App\Models\AssetMetadata;
use App\Services\DuplicateDetectionService;
use App\Services\GeminiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAssetAI implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 30;
    public int $timeout = 60;

    public function __construct(public readonly int $assetId)
    {
    }

    public function handle(): void
    {
        $asset = Asset::find($this->assetId);

        if (!$asset) {
            Log::warning('ProcessAssetAI: asset not found', ['asset_id' => $this->assetId]);
            return;
        }

        $gemini   = app(GeminiService::class);
        $metadata = $gemini->generateAssetMetadata(
            $asset->original_name,
            $asset->mime_type,
            $asset->path,
            $asset->cloudinary_url
        );

        AssetMetadata::create([
            'asset_id'     => $asset->id,
            'title'        => $metadata['title'],
            'description'  => $metadata['description'],
            'tags'         => $metadata['tags'],
            'ai_generated' => true,
        ]);

        $duplicateDetector = app(DuplicateDetectionService::class);
        $duplicateDetector->findSimilar(
            $asset->id,
            $metadata['description'] ?? '',
            $metadata['tags'] ?? []
        );

        $asset->update(['status' => 'processed']);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('ProcessAssetAI permanently failed', [
            'asset_id' => $this->assetId,
            'error'    => $exception->getMessage(),
        ]);

        Asset::where('id', $this->assetId)->update(['status' => 'failed']);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Jobs/ProcessAssetAI.php
git commit -m "feat: implement ProcessAssetAI job with Gemini metadata and duplicate detection"
```

---

## Task 3: Modify AssetApiController to dispatch job

**Files:**
- Modify: `app/Http/Controllers/Api/AssetApiController.php`

- [ ] **Step 1: Add ProcessAssetAI import**

In the `use` statements at the top of the file, add:
```php
use App\Jobs\ProcessAssetAI;
```

Remove these three lines (no longer used in the controller):
```php
use App\Models\AssetMetadata;
use App\Services\GeminiService;
use App\Services\DuplicateDetectionService;
```

- [ ] **Step 2: Replace sync AI block in store() with job dispatch**

Find and replace this entire block in `store()`:
```php
        $gemini   = app(GeminiService::class);
        $metadata = $gemini->generateAssetMetadata(
            $file->getClientOriginalName(),
            $file->getMimeType(),
            $path,
            $cloudinaryResult['url'] ?? null
        );

        AssetMetadata::create([
            'asset_id'     => $asset->id,
            'title'        => $metadata['title'],
            'description'  => $metadata['description'],
            'tags'         => $metadata['tags'],
            'ai_generated' => true,
        ]);

        $asset->update(['status' => 'processed']);
        $this->logActivity('upload', $asset, ['filename' => $asset->original_name]);

        // Detección de duplicados semánticos con IA
        $duplicateDetector = app(DuplicateDetectionService::class);
        $similarAssets     = $duplicateDetector->findSimilar(
            $asset->id,
            $metadata['description'] ?? '',
            $metadata['tags'] ?? []
        );

        return response()->json([
            'success'        => true,
            'data'           => $this->formatAsset($asset->fresh(['user', 'metadata', 'categories'])),
            'similar_assets' => $similarAssets,
            'has_duplicates' => !empty($similarAssets),
        ], 201);
```

With:
```php
        ProcessAssetAI::dispatch($asset->id);
        $this->logActivity('upload', $asset, ['filename' => $asset->original_name]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatAsset($asset->fresh(['user', 'metadata', 'categories'])),
        ], 201);
```

- [ ] **Step 3: Verify no PHP syntax errors**

```bash
cd c:/xampp/htdocs/dam-platform
php artisan route:list --path=api/assets 2>&1 | head -10
```
Expected: routes listed without PHP errors.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/Api/AssetApiController.php
git commit -m "feat: dispatch ProcessAssetAI job instead of sync AI processing in upload"
```

---

## Task 4: Add status endpoint

**Files:**
- Modify: `routes/api.php`

- [ ] **Step 1: Add status route inside the auth:sanctum group**

In `routes/api.php`, inside the `Route::middleware('auth:sanctum')` group, add after `Route::get('/assets/{asset}', ...)`:

```php
    Route::get('/assets/{asset}/status', function (Asset $asset) {
        $asset->load('metadata');
        return response()->json([
            'status'   => $asset->status,
            'metadata' => $asset->metadata ? [
                'title'        => $asset->metadata->title,
                'description'  => $asset->metadata->description,
                'tags'         => $asset->metadata->tags,
                'ai_generated' => $asset->metadata->ai_generated,
            ] : null,
        ]);
    });
```

- [ ] **Step 2: Verify the route is registered**

```bash
php artisan route:list --path=api/assets
```
Expected: `GET api/assets/{asset}/status` appears in the list.

- [ ] **Step 3: Commit and push all backend changes**

```bash
git add routes/api.php
git commit -m "feat: add GET /assets/{id}/status endpoint for polling"
git push origin main
```

---

## Task 5: Add polling to AssetUploadView.vue (Frontend)

**Files:**
- Modify: `src/views/AssetUploadView.vue`

- [ ] **Step 1: Add pollingMessage ref and replace handleUpload + add pollStatus**

In `<script setup>`, add `pollingMessage` ref and replace `handleUpload`, add `pollStatus`:

```js
const pollingMessage = ref('')

async function handleUpload() {
  if (!selectedFile.value) return

  loading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await api.post('/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const assetId = response.data.data.id
    clearFile()
    loading.value = false
    pollingMessage.value = 'La IA está analizando tu imagen...'

    await pollStatus(assetId)

  } catch (e) {
    loading.value = false
    if (e.response?.status === 409) {
      toast.error('❌ Este archivo exacto ya existe en la plataforma. No se ha subido.')
    } else {
      toast.error('Error al subir el archivo. Inténtalo de nuevo.')
    }
  }
}

function pollStatus(assetId) {
  return new Promise((resolve) => {
    const MAX_ATTEMPTS = 20
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++

      try {
        const res = await api.get(`/assets/${assetId}/status`)
        const { status } = res.data

        if (status === 'processed') {
          clearInterval(interval)
          pollingMessage.value = ''
          toast.success('Asset procesado correctamente ✨')
          router.push({ name: 'asset-detail', params: { id: assetId } })
          resolve()
        } else if (status === 'failed') {
          clearInterval(interval)
          pollingMessage.value = ''
          toast.error('No se pudieron generar los metadatos. El asset está disponible sin ellos.')
          router.push({ name: 'asset-detail', params: { id: assetId } })
          resolve()
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval)
          pollingMessage.value = ''
          router.push({ name: 'asset-detail', params: { id: assetId } })
          resolve()
        }
      } catch {
        clearInterval(interval)
        pollingMessage.value = ''
        router.push({ name: 'asset-detail', params: { id: assetId } })
        resolve()
      }
    }, 3000)
  })
}
```

- [ ] **Step 2: Add polling message to the template**

In the template, add this block above `<!-- Botones -->`:

```html
<!-- Estado de procesamiento IA -->
<div
  v-if="pollingMessage"
  class="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2"
>
  <span class="animate-spin inline-block">⏳</span>
  {{ pollingMessage }}
</div>
```

- [ ] **Step 3: Update submit button to disable during polling**

Find the submit button and update its `:disabled` binding:

```html
<button
  type="submit"
  :disabled="!selectedFile || loading || !!pollingMessage"
  class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
>
  {{ loading ? 'Subiendo...' : 'Subir asset' }}
</button>
```

- [ ] **Step 4: Commit and push**

```bash
cd c:/xampp/htdocs/dam-frontend
git add src/views/AssetUploadView.vue
git commit -m "feat: add polling after upload to show AI processing status"
git push origin main
```

---

## Verificación final

Tras ambos deploys (Render ~3min, Netlify ~1min):

1. Abrir `https://dam-platform-ai.netlify.app/assets/upload`
2. Subir una imagen
3. El botón desaparece y aparece "La IA está analizando tu imagen... ⏳"
4. Tras ~5 segundos redirige al detalle con metadatos generados por IA
5. En Render logs debe aparecer: `Processed App\Jobs\ProcessAssetAI`
