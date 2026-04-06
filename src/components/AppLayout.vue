<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Toast notifications -->
    <ToastNotification />

    <!-- Navbar -->
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-6">
            <span class="font-bold text-blue-600 text-lg">DAM</span>
            <div class="hidden sm:flex gap-4">
              <RouterLink
                to="/dashboard"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium"
                active-class="text-blue-600"
              >
                Dashboard
              </RouterLink>
              <RouterLink
                to="/assets"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium"
                active-class="text-blue-600"
              >
                Assets
              </RouterLink>
            </div>
          </div>

          <div class="hidden sm:flex items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ auth.user?.name }}</span>
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
              {{ auth.user?.role }}
            </span>
            <!-- Botón modo oscuro -->
            <button
              @click="theme.toggle()"
              class="text-gray-500 dark:text-gray-300 hover:text-blue-600 text-lg"
              :title="theme.isDark ? 'Modo claro' : 'Modo oscuro'"
            >
              {{ theme.isDark ? '☀️' : '🌙' }}
            </button>
            <button @click="handleLogout" class="text-sm text-red-600 hover:underline">
              Cerrar sesión
            </button>
          </div>

          <!-- Menú móvil -->
          <div class="sm:hidden flex items-center gap-3">
            <button @click="theme.toggle()" class="text-gray-500 dark:text-gray-300">
              {{ theme.isDark ? '☀️' : '🌙' }}
            </button>
            <button
              class="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              @click="menuOpen = !menuOpen"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  v-if="!menuOpen"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Menú móvil desplegable -->
      <div
        v-if="menuOpen"
        class="sm:hidden border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-3 bg-white dark:bg-gray-800"
      >
        <RouterLink
          to="/dashboard"
          class="block text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium"
          active-class="text-blue-600"
          @click="menuOpen = false"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/assets"
          class="block text-gray-600 dark:text-gray-300 hover:text-blue-600 text-sm font-medium"
          active-class="text-blue-600"
          @click="menuOpen = false"
        >
          Assets
        </RouterLink>
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
          <p class="text-sm text-gray-600 dark:text-gray-300">{{ auth.user?.name }}</p>
          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
            {{ auth.user?.role }}
          </span>
          <button @click="handleLogout" class="block mt-2 text-sm text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>

    <!-- Contenido -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { useThemeStore } from '../stores/theme'
import { useRouter } from 'vue-router'
import ToastNotification from './ToastNotification.vue'

const auth = useAuthStore()
const toast = useToastStore()
const theme = useThemeStore()
const router = useRouter()
const menuOpen = ref(false)

async function handleLogout() {
  await auth.logout()
  toast.success('Sesión cerrada correctamente')
  router.push({ name: 'login' })
}
</script>
