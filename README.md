# DAM Frontend — Digital Asset Management

Frontend SPA desarrollado con Vue 3 que consume la API REST del proyecto [DAM Platform](https://github.com/Rubenesky/dam-platform).

## 🚀 Características

- **Vue 3** con Composition API
- **Vue Router** con protección de rutas por autenticación
- **Pinia** para gestión de estado global (autenticación)
- **Tailwind CSS** para estilos
- **Axios** para comunicación con la API REST
- **Filtros en tiempo real** sin recargar la página
- **Subida de archivos** con drag & drop
- **Metadatos generados por IA** visibles en la interfaz

## 🛠️ Stack tecnológico

| Capa          | Tecnología   |
| ------------- | ------------ |
| Framework     | Vue 3        |
| Routing       | Vue Router   |
| Estado global | Pinia        |
| HTTP Client   | Axios        |
| Estilos       | Tailwind CSS |
| Build tool    | Vite         |

## ⚙️ Instalación local

### Requisitos previos

- Node.js 18+
- npm
- [DAM Platform](https://github.com/Rubenesky/dam-platform) corriendo en local

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Rubenesky/dam-frontend.git
cd dam-frontend

# 2. Instalar dependencias
npm install

# 3. Arrancar el servidor de desarrollo
npm run dev
```

Entra a `http://localhost:5173` en el navegador.

## 🔗 Conexión con el backend

Este proyecto consume la API REST de [DAM Platform](https://github.com/Rubenesky/dam-platform). Asegúrate de que el backend está corriendo en `http://localhost:8000` antes de arrancar el frontend.

La configuración de la URL base de la API está en `src/api/axios.js`:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})
```

## 📱 Vistas disponibles

| Ruta             | Vista                              | Acceso      |
| ---------------- | ---------------------------------- | ----------- |
| `/login`         | Formulario de login                | Público     |
| `/dashboard`     | Estadísticas y assets recientes    | Autenticado |
| `/assets`        | Listado con filtros en tiempo real | Autenticado |
| `/assets/:id`    | Detalle de asset con metadatos IA  | Autenticado |
| `/assets/upload` | Subida de archivos                 | Autenticado |

## 🔐 Autenticación

El frontend usa autenticación por token con Laravel Sanctum. Al hacer login se guarda el token en `localStorage` y se añade automáticamente a todas las peticiones via un interceptor de Axios.

Si el token expira o es inválido, el usuario es redirigido automáticamente al login.

## 👨‍💻 Autor

Desarrollado por **Rubén Jiménez** como proyecto de portfolio para el módulo DAW.

Proyecto backend: [DAM Platform](https://github.com/Rubenesky/dam-platform)
