<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-8">
            <span class="font-bold text-blue-600 text-lg">DAM Platform</span>
            <div class="flex gap-4">
              <RouterLink
                to="/dashboard"
                class="text-gray-600 hover:text-blue-600 text-sm font-medium"
                active-class="text-blue-600"
              >
                Dashboard
              </RouterLink>
              <RouterLink
                to="/assets"
                class="text-gray-600 hover:text-blue-600 text-sm font-medium"
                active-class="text-blue-600"
              >
                Assets
              </RouterLink>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ auth.user?.name }}</span>
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
              {{ auth.user?.role }}
            </span>
            <button @click="handleLogout" class="text-sm text-red-600 hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Contenido -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>
