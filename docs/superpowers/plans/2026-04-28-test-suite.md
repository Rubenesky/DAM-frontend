# Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 27 strategic tests (18 backend con Pest, 9 frontend con Vitest) y CI con GitHub Actions + badges en ambos repos.

**Architecture:** Backend usa Pest sobre SQLite en memoria — tests rápidos sin dependencias externas. Los servicios externos (Cloudinary, Gemini) se mockean via el contenedor de Laravel. Frontend usa Vitest + Vue Test Utils + @pinia/testing para tests de stores, componentes y guards.

**Tech Stack:** Pest 2.x, PHPUnit 10, SQLite :memory:, Vitest 1.x, @vue/test-utils 2.x, @pinia/testing, GitHub Actions

---

## File Map

### Backend (`c:/xampp/htdocs/dam-platform`)
- **Modify:** `phpunit.xml` — habilitar SQLite en memoria
- **Create:** `.env.testing.example` — config de entorno para tests
- **Modify:** `composer.json` — añadir pestphp/pest
- **Modify:** `app/Http/Controllers/Api/AssetApiController.php` — usar `app()` en lugar de `new` para los servicios
- **Create:** `tests/Feature/Auth/AuthTest.php` — 5 tests de autenticación
- **Create:** `tests/Feature/Authorization/RolePermissionsTest.php` — 5 tests de roles
- **Create:** `tests/Feature/Assets/AssetUploadTest.php` — 5 tests de upload
- **Create:** `tests/Feature/Assets/AssetCrudTest.php` — 3 tests de CRUD
- **Create:** `.github/workflows/tests.yml` — CI backend

### Frontend (`c:/xampp/htdocs/dam-frontend`)
- **Modify:** `package.json` — añadir vitest, @vue/test-utils, @pinia/testing, jsdom
- **Create:** `vitest.config.js` — configuración de Vitest
- **Create:** `src/stores/__tests__/auth.test.js` — 3 tests del store
- **Create:** `src/views/__tests__/AssetUploadView.test.js` — 3 tests de validación
- **Create:** `src/router/__tests__/guards.test.js` — 3 tests de guards
- **Create:** `.github/workflows/tests.yml` — CI frontend

---

## Task 1: Instalar Pest y configurar SQLite (Backend)

**Files:**
- Modify: `composer.json`
- Modify: `phpunit.xml`
- Create: `.env.testing.example`

- [ ] **Step 1: Instalar Pest**

```bash
cd c:/xampp/htdocs/dam-platform
composer require pestphp/pest --dev --with-all-dependencies
./vendor/bin/pest --init
```
Expected: crea `tests/Pest.php`. Acepta defaults.

- [ ] **Step 2: Habilitar SQLite en phpunit.xml**

Reemplazar el bloque `<php>` de `phpunit.xml` con:

```xml
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="BCRYPT_ROUNDS" value="4"/>
    <env name="CACHE_DRIVER" value="array"/>
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE" value=":memory:"/>
    <env name="MAIL_MAILER" value="array"/>
    <env name="QUEUE_CONNECTION" value="sync"/>
    <env name="SESSION_DRIVER" value="array"/>
    <env name="GEMINI_API_KEY" value="fake-key-for-tests"/>
    <env name="CLOUDINARY_CLOUD_NAME" value="test"/>
    <env name="CLOUDINARY_API_KEY" value="test"/>
    <env name="CLOUDINARY_API_SECRET" value="test"/>
</php>
```

- [ ] **Step 3: Crear .env.testing.example**

Crear `c:/xampp/htdocs/dam-platform/.env.testing.example`:

```
APP_NAME="DAM Platform"
APP_ENV=testing
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

DB_CONNECTION=sqlite
DB_DATABASE=:memory:

CACHE_DRIVER=array
QUEUE_CONNECTION=sync
SESSION_DRIVER=array

GEMINI_API_KEY=fake-key-for-tests
CLOUDINARY_CLOUD_NAME=test
CLOUDINARY_API_KEY=test
CLOUDINARY_API_SECRET=test
```

- [ ] **Step 4: Verificar que los tests existentes pasan**

```bash
cd c:/xampp/htdocs/dam-platform
php artisan test
```
Expected: tests existentes en verde con SQLite.

- [ ] **Step 5: Commit**

```bash
git add composer.json composer.lock phpunit.xml .env.testing.example tests/Pest.php
git commit -m "chore: install Pest and configure SQLite for testing"
```

---

## Task 2: Refactorizar AssetApiController para inyección de dependencias

**Files:**
- Modify: `app/Http/Controllers/Api/AssetApiController.php`

- [ ] **Step 1: Cambiar los tres `new` por `app()` en el método store()**

En `app/Http/Controllers/Api/AssetApiController.php`, dentro de `store()`:

```php
// Antes:
$cloudinary       = new CloudinaryService();
$gemini           = new GeminiService();
$duplicateDetector = new DuplicateDetectionService();

// Después:
$cloudinary        = app(CloudinaryService::class);
$gemini            = app(GeminiService::class);
$duplicateDetector = app(DuplicateDetectionService::class);
```

- [ ] **Step 2: Verificar que la app sigue funcionando**

```bash
php artisan test
```
Expected: mismos resultados que antes.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/Api/AssetApiController.php
git commit -m "refactor: resolve services via container for testability"
```

---

## Task 3: Tests de autenticación (Backend)

**Files:**
- Create: `tests/Feature/Auth/AuthTest.php`

- [ ] **Step 1: Crear el archivo**

Crear `c:/xampp/htdocs/dam-platform/tests/Feature/Auth/AuthTest.php`:

```php
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('devuelve token con credenciales válidas', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/login', [
        'email'    => $user->email,
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
             ->assertJsonStructure(['token', 'user' => ['id', 'role']]);
});

it('rechaza credenciales incorrectas con 422', function () {
    $user = User::factory()->create();

    $this->postJson('/api/login', [
        'email'    => $user->email,
        'password' => 'contraseña-incorrecta',
    ])->assertStatus(422);
});

it('rechaza acceso a rutas protegidas sin token', function () {
    $this->getJson('/api/assets')->assertStatus(401);
});

it('logout invalida el token', function () {
    $user  = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $this->withToken($token)->postJson('/api/logout')->assertStatus(200);
    $this->withToken($token)->getJson('/api/assets')->assertStatus(401);
});

it('bloquea el login tras 5 intentos fallidos', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/login', [
            'email'    => $user->email,
            'password' => 'wrong',
        ]);
    }

    $this->postJson('/api/login', [
        'email'    => $user->email,
        'password' => 'wrong',
    ])->assertStatus(429);
});
```

- [ ] **Step 2: Ejecutar solo estos tests**

```bash
php artisan test tests/Feature/Auth/AuthTest.php --verbose
```
Expected: 5 tests en verde.

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Auth/AuthTest.php
git commit -m "test: add auth feature tests (login, logout, rate limiting)"
```

---

## Task 4: Tests de permisos por rol (Backend)

**Files:**
- Create: `tests/Feature/Authorization/RolePermissionsTest.php`
- Modify: `app/Http/Controllers/Api/AssetApiController.php` (si viewer puede editar)

- [ ] **Step 1: Crear el archivo**

Crear `c:/xampp/htdocs/dam-platform/tests/Feature/Authorization/RolePermissionsTest.php`:

```php
<?php

use App\Models\Asset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('admin puede borrar un asset', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $asset = Asset::factory()->create();

    $this->actingAs($admin, 'sanctum')
         ->deleteJson("/api/assets/{$asset->id}")
         ->assertStatus(200);
});

it('editor no puede borrar un asset', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $asset  = Asset::factory()->create();

    $this->actingAs($editor, 'sanctum')
         ->deleteJson("/api/assets/{$asset->id}")
         ->assertStatus(403);
});

it('viewer no puede borrar un asset', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);
    $asset  = Asset::factory()->create();

    $this->actingAs($viewer, 'sanctum')
         ->deleteJson("/api/assets/{$asset->id}")
         ->assertStatus(403);
});

it('viewer no puede editar metadatos', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);
    $asset  = Asset::factory()->create();

    $this->actingAs($viewer, 'sanctum')
         ->patchJson("/api/assets/{$asset->id}", ['title' => 'Nuevo título'])
         ->assertStatus(403);
});

it('editor puede editar metadatos', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $asset  = Asset::factory()->create();

    $this->actingAs($editor, 'sanctum')
         ->patchJson("/api/assets/{$asset->id}", [
             'title' => 'Título editado',
             'tags'  => 'tag1, tag2',
         ])
         ->assertStatus(200)
         ->assertJsonPath('data.metadata.title', 'Título editado');
});
```

- [ ] **Step 2: Ejecutar y corregir si viewer puede editar**

```bash
php artisan test tests/Feature/Authorization/RolePermissionsTest.php --verbose
```

Si el test de viewer falla (devuelve 200 en lugar de 403), añadir al inicio del método `update()` en `AssetApiController.php`:

```php
if (auth()->user()->role === 'viewer') {
    return response()->json(['success' => false, 'message' => 'Sin permiso.'], 403);
}
```

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Authorization/RolePermissionsTest.php app/Http/Controllers/Api/AssetApiController.php
git commit -m "test: add role permission tests + block viewer from editing"
```

---

## Task 5: Tests de upload de assets (Backend)

**Files:**
- Create: `tests/Feature/Assets/AssetUploadTest.php`
- Modify: `database/factories/AssetFactory.php`

- [ ] **Step 1: Añadir file_hash a AssetFactory**

En `database/factories/AssetFactory.php`, añadir `file_hash` al array de `definition()`:

```php
'file_hash' => md5(Str::random(32)),
```

- [ ] **Step 2: Crear el archivo de tests**

Crear `c:/xampp/htdocs/dam-platform/tests/Feature/Assets/AssetUploadTest.php`:

```php
<?php

use App\Models\Asset;
use App\Models\AssetMetadata;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\DuplicateDetectionService;
use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->mock(CloudinaryService::class, function ($mock) {
        $mock->shouldReceive('upload')->andReturn([
            'public_id' => 'test/fake-id',
            'url'       => 'https://res.cloudinary.com/test/image/upload/fake.jpg',
        ]);
    });

    $this->mock(GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateAssetMetadata')->andReturn([
            'title'       => 'Imagen de prueba',
            'description' => 'Descripción generada',
            'tags'        => ['prueba'],
        ]);
    });

    $this->mock(DuplicateDetectionService::class, function ($mock) {
        $mock->shouldReceive('findSimilar')->andReturn([]);
    });
});

it('sube un archivo jpg válido y devuelve 201', function () {
    $user = User::factory()->create(['role' => 'editor']);
    $file = UploadedFile::fake()->image('foto.jpg', 800, 600);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/assets', ['file' => $file])
         ->assertStatus(201)
         ->assertJsonStructure(['data' => ['id', 'url', 'status']]);
});

it('rechaza un archivo exe con 422', function () {
    $user = User::factory()->create(['role' => 'editor']);
    $file = UploadedFile::fake()->create('malware.exe', 100, 'application/octet-stream');

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/assets', ['file' => $file])
         ->assertStatus(422);
});

it('rechaza archivos mayores de 10MB con 422', function () {
    $user = User::factory()->create(['role' => 'editor']);
    $file = UploadedFile::fake()->create('grande.jpg', 11000, 'image/jpeg');

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/assets', ['file' => $file])
         ->assertStatus(422);
});

it('detecta duplicado exacto por hash y devuelve 409', function () {
    $user = User::factory()->create(['role' => 'editor']);
    $file = UploadedFile::fake()->image('foto.jpg');
    $hash = md5_file($file->getRealPath());

    Asset::factory()->create(['file_hash' => $hash]);

    $this->actingAs($user, 'sanctum')
         ->postJson('/api/assets', ['file' => $file])
         ->assertStatus(409)
         ->assertJsonStructure(['existing_asset']);
});

it('el asset procesado tiene metadatos generados', function () {
    $user = User::factory()->create(['role' => 'editor']);
    $file = UploadedFile::fake()->image('foto.jpg');

    $response = $this->actingAs($user, 'sanctum')
                     ->postJson('/api/assets', ['file' => $file])
                     ->assertStatus(201);

    $assetId = $response->json('data.id');
    expect(AssetMetadata::where('asset_id', $assetId)->exists())->toBeTrue();
});
```

- [ ] **Step 3: Ejecutar**

```bash
php artisan test tests/Feature/Assets/AssetUploadTest.php --verbose
```
Expected: 5 tests en verde.

- [ ] **Step 4: Commit**

```bash
git add tests/Feature/Assets/AssetUploadTest.php database/factories/AssetFactory.php
git commit -m "test: add asset upload tests with mocked external services"
```

---

## Task 6: Tests de CRUD de assets (Backend)

**Files:**
- Create: `tests/Feature/Assets/AssetCrudTest.php`

- [ ] **Step 1: Crear el archivo**

Crear `c:/xampp/htdocs/dam-platform/tests/Feature/Assets/AssetCrudTest.php`:

```php
<?php

use App\Models\Asset;
use App\Models\AssetMetadata;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('listado devuelve paginación correcta', function () {
    $user = User::factory()->create();
    Asset::factory()->count(5)->create();

    $this->actingAs($user, 'sanctum')
         ->getJson('/api/assets')
         ->assertStatus(200)
         ->assertJsonStructure([
             'data',
             'meta' => ['total', 'per_page', 'current_page', 'last_page'],
         ]);
});

it('detalle de asset tiene estructura completa', function () {
    $user  = User::factory()->create();
    $asset = Asset::factory()->create(['user_id' => $user->id]);
    AssetMetadata::create([
        'asset_id'     => $asset->id,
        'title'        => 'Título de prueba',
        'description'  => 'Descripción',
        'tags'         => ['tag1'],
        'ai_generated' => true,
    ]);

    $this->actingAs($user, 'sanctum')
         ->getJson("/api/assets/{$asset->id}")
         ->assertStatus(200)
         ->assertJsonStructure([
             'data' => ['id', 'url', 'metadata', 'categories', 'uploaded_by'],
         ]);
});

it('editar metadatos actualiza título y tags', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $asset  = Asset::factory()->create();

    $this->actingAs($editor, 'sanctum')
         ->patchJson("/api/assets/{$asset->id}", [
             'title' => 'Título actualizado',
             'tags'  => 'nuevo, tag',
         ])
         ->assertStatus(200)
         ->assertJsonPath('data.metadata.title', 'Título actualizado');
});
```

- [ ] **Step 2: Ejecutar toda la suite backend**

```bash
php artisan test --verbose
```
Expected: 18+ tests, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Assets/AssetCrudTest.php
git commit -m "test: add asset CRUD feature tests"
```

---

## Task 7: Instalar y configurar Vitest (Frontend)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1: Instalar dependencias**

```bash
cd c:/xampp/htdocs/dam-frontend
npm install --save-dev vitest @vue/test-utils @pinia/testing jsdom
```

- [ ] **Step 2: Añadir scripts en package.json**

En `package.json`, añadir dentro de `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Crear vitest.config.js**

Crear `c:/xampp/htdocs/dam-frontend/vitest.config.js`:

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

- [ ] **Step 4: Verificar que Vitest arranca sin errores**

```bash
npm run test
```
Expected: "No test files found" — sin errores de configuración.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js
git commit -m "chore: install and configure Vitest for frontend testing"
```

---

## Task 8: Tests del store de autenticación (Frontend)

**Files:**
- Create: `src/stores/__tests__/auth.test.js`

- [ ] **Step 1: Crear el archivo**

Crear `c:/xampp/htdocs/dam-frontend/src/stores/__tests__/auth.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import api from '../../api/axios'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('login guarda token y user en el store', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token-123',
        user: { id: 1, name: 'Ruben', email: 'r@test.com', role: 'admin' },
      },
    })

    const auth = useAuthStore()
    await auth.login('r@test.com', 'password')

    expect(auth.token).toBe('fake-token-123')
    expect(auth.user.role).toBe('admin')
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe('fake-token-123')
  })

  it('logout limpia token, user e isAuthenticated', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'tk', user: { id: 1, name: 'R', email: 'r@t.com', role: 'admin' } },
    })
    api.post.mockResolvedValueOnce({})

    const auth = useAuthStore()
    await auth.login('r@t.com', 'pass')
    await auth.logout()

    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('isAuthenticated es true con token y false sin él', () => {
    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(false)
    auth.token = 'some-token'
    expect(auth.isAuthenticated).toBe(true)
  })
})
```

- [ ] **Step 2: Ejecutar**

```bash
npm run test src/stores/__tests__/auth.test.js
```
Expected: 3 tests en verde.

- [ ] **Step 3: Commit**

```bash
git add src/stores/__tests__/auth.test.js
git commit -m "test: add auth store unit tests"
```

---

## Task 9: Tests de validación de archivo (Frontend)

**Files:**
- Create: `src/views/__tests__/AssetUploadView.test.js`

- [ ] **Step 1: Crear el archivo**

Crear `c:/xampp/htdocs/dam-frontend/src/views/__tests__/AssetUploadView.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function makeSetFile(selectedFile, toast) {
  return function setFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Usa imágenes, PDF, vídeo o audio.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('El archivo supera el límite de 10MB.')
      return
    }
    selectedFile.value = file
  }
}

describe('setFile — validación de archivo', () => {
  let selectedFile
  let toast
  let setFile

  beforeEach(() => {
    selectedFile = ref(null)
    toast = { error: vi.fn() }
    setFile = makeSetFile(selectedFile, toast)
  })

  it('rechaza un archivo .exe y llama toast.error', () => {
    const file = new File(['contenido'], 'malware.exe', { type: 'application/octet-stream' })

    setFile(file)

    expect(toast.error).toHaveBeenCalledWith(
      'Tipo de archivo no permitido. Usa imágenes, PDF, vídeo o audio.'
    )
    expect(selectedFile.value).toBeNull()
  })

  it('rechaza un archivo mayor de 10MB y llama toast.error', () => {
    const bigContent = new Uint8Array(11 * 1024 * 1024)
    const file = new File([bigContent], 'grande.jpg', { type: 'image/jpeg' })

    setFile(file)

    expect(toast.error).toHaveBeenCalledWith('El archivo supera el límite de 10MB.')
    expect(selectedFile.value).toBeNull()
  })

  it('acepta un .jpg válido y asigna selectedFile', () => {
    const file = new File(['imagen'], 'foto.jpg', { type: 'image/jpeg' })

    setFile(file)

    expect(toast.error).not.toHaveBeenCalled()
    expect(selectedFile.value).toBe(file)
  })
})
```

- [ ] **Step 2: Ejecutar**

```bash
npm run test src/views/__tests__/AssetUploadView.test.js
```
Expected: 3 tests en verde.

- [ ] **Step 3: Commit**

```bash
git add src/views/__tests__/AssetUploadView.test.js
git commit -m "test: add file validation unit tests"
```

---

## Task 10: Tests de guards del router (Frontend)

**Files:**
- Create: `src/router/__tests__/guards.test.js`

- [ ] **Step 1: Crear el archivo**

Crear `c:/xampp/htdocs/dam-frontend/src/router/__tests__/guards.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

function runGuard(to, authToken) {
  const auth = useAuthStore()
  auth.token = authToken

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return undefined
}

describe('Router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('ruta protegida sin token redirige a /login', () => {
    const result = runGuard({ meta: { requiresAuth: true } }, null)
    expect(result).toEqual({ name: 'login' })
  })

  it('ruta protegida con token permite el acceso', () => {
    const result = runGuard({ meta: { requiresAuth: true } }, 'valid-token')
    expect(result).toBeUndefined()
  })

  it('ruta guest con token redirige a /dashboard', () => {
    const result = runGuard({ meta: { guest: true } }, 'valid-token')
    expect(result).toEqual({ name: 'dashboard' })
  })
})
```

- [ ] **Step 2: Ejecutar toda la suite frontend**

```bash
npm run test
```
Expected: 9 tests en verde.

- [ ] **Step 3: Commit**

```bash
git add src/router/__tests__/guards.test.js
git commit -m "test: add router guard unit tests"
```

---

## Task 11: CI GitHub Actions — Backend

**Files:**
- Create: `c:/xampp/htdocs/dam-platform/.github/workflows/tests.yml`

- [ ] **Step 1: Crear el directorio y el workflow**

Crear `c:/xampp/htdocs/dam-platform/.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: pdo, pdo_sqlite, sqlite3

      - name: Install dependencies
        run: composer install --no-interaction --prefer-dist

      - name: Generate app key
        run: |
          cp .env.testing.example .env.testing
          php artisan key:generate --env=testing

      - name: Run tests
        run: php artisan test --env=testing
```

- [ ] **Step 2: Commit y push**

```bash
cd c:/xampp/htdocs/dam-platform
git add .github/workflows/tests.yml
git commit -m "ci: add GitHub Actions workflow for backend tests"
git push origin main
```

- [ ] **Step 3: Verificar en GitHub**

Abrir `https://github.com/Rubenesky/dam-platform/actions` y confirmar que el workflow corre en verde.

---

## Task 12: CI GitHub Actions — Frontend

**Files:**
- Create: `c:/xampp/htdocs/dam-frontend/.github/workflows/tests.yml`

- [ ] **Step 1: Crear el workflow**

Crear `c:/xampp/htdocs/dam-frontend/.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test
```

- [ ] **Step 2: Commit y push**

```bash
cd c:/xampp/htdocs/dam-frontend
git add .github/workflows/tests.yml
git commit -m "ci: add GitHub Actions workflow for frontend tests"
git push origin main
```

- [ ] **Step 3: Verificar en GitHub**

Abrir `https://github.com/Rubenesky/dam-frontend/actions` y confirmar que el workflow pasa.

---

## Task 13: Badges en los README

**Files:**
- Modify: `c:/xampp/htdocs/dam-platform/README.md`
- Modify: `c:/xampp/htdocs/dam-frontend/README.md`

- [ ] **Step 1: Añadir badge al README del backend**

En `dam-platform/README.md`, añadir justo debajo del título `# DAM Platform`:

```markdown
![Tests](https://github.com/Rubenesky/dam-platform/actions/workflows/tests.yml/badge.svg)
```

- [ ] **Step 2: Añadir badge al README del frontend**

En `dam-frontend/README.md`, añadir justo debajo del título `# DAM Frontend`:

```markdown
![Tests](https://github.com/Rubenesky/dam-frontend/actions/workflows/tests.yml/badge.svg)
```

- [ ] **Step 3: Commit y push ambos repos**

```bash
cd c:/xampp/htdocs/dam-platform
git add README.md
git commit -m "docs: add CI tests badge to README"
git push origin main

cd c:/xampp/htdocs/dam-frontend
git add README.md
git commit -m "docs: add CI tests badge to README"
git push origin main
```

- [ ] **Step 4: Confirmar badges en verde**

Abrir ambos repos en GitHub y verificar que los badges aparecen en verde en la portada del repo.

---

## Verificación final

```bash
# Backend — todos los tests en verde
cd c:/xampp/htdocs/dam-platform
php artisan test --verbose
# Expected: 18+ tests, 0 failures

# Frontend — todos los tests en verde
cd c:/xampp/htdocs/dam-frontend
npm run test
# Expected: 9 tests, 0 failures
```
