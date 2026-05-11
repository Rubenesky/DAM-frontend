# Async Queue System Design

## Goal

Move Gemini metadata generation and duplicate detection from the synchronous upload request to a background job. Upload response time drops from ~8s to ~2s. The user sees the asset immediately; metadata fills in via polling.

## Architecture

Cloudinary upload stays synchronous (needed to get the URL for Gemini Vision). Only the slow parts move to the background: Gemini + DuplicateDetectionService.

**Before (synchronous, ~8s blocked):**
```
Upload → Cloudinary → Gemini → DuplicateDetection → 201 response
```

**After (async, ~2s response):**
```
Upload → Cloudinary → save asset (status=pending) → 201 response
                                  ↓ background job
                           Gemini → DuplicateDetection → status=processed
```

## Tech Stack

- Laravel Queue with `database` driver (jobs stored in Supabase `jobs` table — migration already exists)
- No Redis required — works on Render free tier
- Polling from Vue 3 frontend every 3 seconds

## Components

### 1. `ProcessAssetJob` (`app/Jobs/ProcessAssetAI.php`)

Fills the existing empty stub.

- **Constructor:** receives `int $assetId`
- **handle():**
  1. Load asset by ID — if not found, abort silently
  2. Call `GeminiService::generateAssetMetadata()` with `cloudinary_url`
  3. Create `AssetMetadata` record
  4. Call `DuplicateDetectionService::findSimilar()`
  5. Update asset `status = 'processed'`
- **failed():** update asset `status = 'failed'` so it never stays pending forever
- **Retries:** 3 attempts, 30s delay between attempts (`$tries = 3`, `$backoff = 30`)
- **Timeout:** 60 seconds per attempt (`$timeout = 60`)
- **Implements:** `ShouldQueue`

### 2. `AssetApiController::store()` (modified)

- Remove: synchronous Gemini call, AssetMetadata creation, DuplicateDetection call
- Keep: file validation, Cloudinary upload, Asset creation with `status = 'pending'`
- Add: `ProcessAssetJob::dispatch($asset->id)` after creating the asset
- Returns 201 immediately with asset data including `status = 'pending'`
- Response no longer includes `similar_assets` / `has_duplicates` (moved to job)

### 3. New endpoint `GET /api/assets/{id}/status`

Returns current processing status for polling.

```json
{
  "status": "processed",
  "metadata": {
    "title": "...",
    "description": "...",
    "tags": ["..."],
    "ai_generated": true
  }
}
```

Returns `status: "pending"` while job is running, `status: "processed"` when done, `status: "failed"` if all retries exhausted.

### 4. Frontend polling (`src/views/AssetUploadView.vue`)

- After receiving 201 from upload, start polling `GET /api/assets/{id}/status` every 3 seconds
- Show badge/spinner: "Analizando con IA..." while `status === 'pending'`
- When `status === 'processed'`: stop polling, redirect to asset detail page
- When `status === 'failed'`: stop polling, show toast warning "No se pudieron generar los metadatos automáticamente"
- Max polling attempts: 20 (60 seconds total) — if exceeded, redirect anyway

### 5. Queue configuration

**`config/queue.php`:** change default connection from `sync` to `database`

**`render.yaml` start command:**
```
php artisan serve --host=0.0.0.0 --port=$PORT & php artisan queue:work --timeout=60 --tries=3 --sleep=3
```

## Error Handling

- If Gemini fails inside the job: `failed()` method sets `status = 'failed'`
- Frontend handles `failed` status gracefully with a toast (asset still accessible, just without AI metadata)
- If the job never runs (worker down): after 20 polling attempts frontend redirects anyway

## Files Changed

### Backend (`c:/xampp/htdocs/dam-platform`)
- **Modify:** `app/Jobs/ProcessAssetAI.php` — implement the job
- **Modify:** `app/Http/Controllers/Api/AssetApiController.php` — dispatch job instead of sync processing
- **Modify:** `config/queue.php` — change default to `database`
- **Modify:** `routes/api.php` — add status endpoint
- **Modify:** `render.yaml` — update start command

### Frontend (`c:/xampp/htdocs/dam-frontend`)
- **Modify:** `src/views/AssetUploadView.vue` — add polling logic after upload
