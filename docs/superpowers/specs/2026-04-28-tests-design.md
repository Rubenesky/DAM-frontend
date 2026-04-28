# Test Suite Design — DAM Platform + DAM Frontend

## Goal

Add a strategic test suite (27 tests) covering the most critical paths of the DAM platform, plus a CI pipeline with badges in both repos. Quality over quantity: every test verifies real behavior, not framework internals.

## Architecture

- **Backend:** Pest (wrapper over PHPUnit) + SQLite in-memory database
- **Frontend:** Vitest + Vue Test Utils + jsdom
- **CI:** GitHub Actions — two independent jobs (backend + frontend), badge in each README

## Tech Stack

- Backend: Pest 2.x, Laravel 10, SQLite (`:memory:`), User/Asset factories
- Frontend: Vitest 1.x, @vue/test-utils 2.x, @pinia/testing, jsdom
- CI: GitHub Actions `ubuntu-latest`, PHP 8.2, Node 20

---

## Backend Tests (18 tests)

### File: `tests/Feature/Auth/AuthTest.php`

5 tests covering authentication boundaries:

1. **login con credenciales válidas** → HTTP 200 + `token` en respuesta + `user.role` presente
2. **login con contraseña incorrecta** → HTTP 422 + mensaje de error
3. **acceso a ruta protegida sin token** → HTTP 401
4. **logout invalida el token** → logout devuelve 200, siguiente petición con mismo token devuelve 401
5. **rate limiting: 6 intentos de login seguidos** → primeros 5 devuelven 422, el 6º devuelve 429

### File: `tests/Feature/Authorization/RolePermissionsTest.php`

5 tests covering role-based access control:

1. **admin puede borrar un asset** → HTTP 200
2. **editor no puede borrar un asset** → HTTP 403
3. **viewer no puede borrar un asset** → HTTP 403
4. **viewer no puede editar metadatos** → HTTP 403
5. **editor puede editar metadatos** → HTTP 200 + datos actualizados en respuesta

### File: `tests/Feature/Assets/AssetUploadTest.php`

5 tests covering upload validation and duplicate detection:

1. **sube un archivo .jpg válido** → HTTP 201 + asset en respuesta
2. **rechaza un archivo .exe** → HTTP 422 (falla validación mimes)
3. **rechaza archivo mayor de 10MB** → HTTP 422 (falla validación max)
4. **detecta duplicado exacto por hash MD5** → HTTP 409 + `existing_asset` en respuesta
5. **asset procesado tiene metadatos** → `data.metadata` not null tras upload

### File: `tests/Feature/Assets/AssetCrudTest.php`

3 tests covering basic CRUD:

1. **listado devuelve paginación correcta** → respuesta tiene `meta.total`, `meta.per_page`, array `data`
2. **detalle de asset tiene estructura completa** → respuesta tiene `url`, `metadata`, `categories`, `uploaded_by`
3. **editar metadatos actualiza título y tags** → HTTP 200 + nuevos valores en `data.metadata`

---

## Frontend Tests (9 tests)

### File: `src/stores/__tests__/auth.test.js`

3 tests covering Pinia auth store:

1. **login() guarda token y user en el store** → `token` y `user` tienen valor, `isAuthenticated` es true
2. **logout() limpia todo el estado** → token null, user null, isAuthenticated false, localStorage vacío
3. **isAuthenticated computed** → true con token, false sin token

### File: `src/views/__tests__/AssetUploadView.test.js`

3 tests covering client-side file validation in `setFile()`:

1. **rechaza archivo .exe** → toast.error llamado, selectedFile no asignado
2. **rechaza archivo mayor de 10MB** → toast.error llamado, selectedFile no asignado
3. **acepta .jpg válido dentro del límite** → selectedFile asignado, no se llama toast.error

### File: `src/router/__tests__/guards.test.js`

3 tests covering navigation guards:

1. **ruta requiresAuth sin token redirige a /login** → beforeEach devuelve `{ name: 'login' }`
2. **ruta requiresAuth con token permite el acceso** → beforeEach devuelve undefined
3. **ruta guest con token redirige a /dashboard** → beforeEach devuelve `{ name: 'dashboard' }`

---

## CI Pipeline

### Backend `.github/workflows/tests.yml`

```yaml
name: Tests
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.2' }
      - run: composer install --no-interaction
      - run: cp .env.testing.example .env.testing
      - run: php artisan key:generate --env=testing
      - run: php artisan test
```

### Frontend `.github/workflows/tests.yml`

```yaml
name: Tests
on: [push, pull_request]
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test
```

### Badges en README

```markdown
![Backend Tests](https://github.com/Rubenesky/dam-platform/actions/workflows/tests.yml/badge.svg)
![Frontend Tests](https://github.com/Rubenesky/dam-frontend/actions/workflows/tests.yml/badge.svg)
```

---

## `.env.testing.example` (Backend)

```
APP_ENV=testing
APP_KEY=
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
CACHE_DRIVER=array
QUEUE_CONNECTION=sync
GEMINI_API_KEY=fake-key-for-tests
CLOUDINARY_CLOUD_NAME=test
CLOUDINARY_API_KEY=test
CLOUDINARY_API_SECRET=test
```

Servicios externos (Gemini, Cloudinary) se mockean a nivel de test — no se hacen llamadas reales.

---

## Decisiones de diseño

- **Pest sobre PHPUnit puro:** sintaxis más limpia, estándar actual en Laravel moderno
- **SQLite en memoria:** tests rápidos (~2s para los 18), sin dependencias externas en CI
- **Mocks para Gemini y Cloudinary:** los tests de upload no hacen llamadas reales a APIs externas
- **Factories de Laravel:** `User::factory()` y `Asset::factory()` para datos de test realistas
- **Sin mocks vacíos:** cada test verifica comportamiento real del sistema
