<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="text-center">
      <p class="text-8xl font-bold text-blue-600">404</p>
      <h1 class="text-2xl font-bold text-gray-800 mt-4">Página no encontrada</h1>
      <p class="text-gray-500 mt-2">La página que buscas no existe o ha sido eliminada.</p>
      <RouterLink
        to="/dashboard"
        class="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Volver al inicio
      </RouterLink>
    </div>
  </div>
</template>
