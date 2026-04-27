<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Assets</h1>
        <RouterLink
          to="/assets/upload"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Subir asset
        </RouterLink>
      </div>

      <!-- Búsqueda por lenguaje natural -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4">
        <p class="text-white text-sm font-medium mb-2">🧠 Búsqueda inteligente con IA</p>
        <div class="flex gap-2">
          <input
            v-model="nlQuery"
            type="text"
            placeholder="Ej: muéstrame imágenes de paisajes subidas esta semana..."
            class="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            @keyup.enter="handleNLSearch"
          />
          <button
            @click="handleNLSearch"
            :disabled="nlLoading || !nlQuery"
            class="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
          >
            {{ nlLoading ? '...' : 'Buscar' }}
          </button>
        </div>
        <div v-if="nlFilters" class="mt-2 text-xs text-blue-100">
          Filtros detectados:
          <span
            v-for="(value, key) in nlFilters"
            :key="key"
            class="ml-1 bg-white bg-opacity-20 px-2 py-0.5 rounded-full"
          >
            {{ key }}: {{ value }}
          </span>
          <button @click="clearNLSearch" class="ml-2 underline">limpiar</button>
        </div>
      </div>

      <!-- Filtros manuales -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nombre..."
            class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            v-model="filterType"
            class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="image">Imágenes</option>
            <option value="application/pdf">PDFs</option>
          </select>
          <select
            v-model="filterStatus"
            class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="processed">Procesado</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
      </div>

      <!-- Listado -->
      <div v-if="loading" class="text-center py-20 text-gray-400">Cargando assets...</div>

      <div
        v-else-if="displayedAssets.length === 0"
        class="text-center py-20 text-gray-400 dark:text-gray-500"
      >
        No se encontraron assets.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <RouterLink
          v-for="asset in displayedAssets"
          :key="asset.id"
          :to="`/assets/${asset.id}`"
          class="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition p-4 block"
        >
          <div
            class="w-full h-40 rounded-lg mb-3 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
          >
            <img
              v-if="asset.mime_type.startsWith('image/')"
              :src="asset.url"
              :alt="asset.original_name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-4xl">📄</span>
          </div>

          <p class="font-medium text-gray-800 dark:text-gray-200 truncate">
            {{ asset.metadata?.title ?? asset.original_name }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ asset.uploaded_by }} · {{ asset.size_kb }} KB
          </p>

          <span
            v-if="asset.status === 'processed'"
            class="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
          >
            Procesado
          </span>
          <span
            v-else
            class="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
          >
            Pendiente
          </span>
        </RouterLink>
      </div>

      <!-- Paginación -->
      <div v-if="!nlFilters && meta.last_page > 1" class="flex justify-center items-center gap-2">
        <button
          @click="changePage(meta.current_page - 1)"
          :disabled="meta.current_page === 1"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>

        <button
          v-for="page in meta.last_page"
          :key="page"
          @click="changePage(page)"
          class="px-3 py-2 rounded-lg border text-sm"
          :class="
            page === meta.current_page
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          "
        >
          {{ page }}
        </button>

        <button
          @click="changePage(meta.current_page + 1)"
          :disabled="meta.current_page === meta.last_page"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>

      <p class="text-center text-sm text-gray-400">
        {{ displayedAssets.length }} asset(s) {{ nlFilters ? 'encontrados por IA' : 'en total' }}
      </p>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const toast = useToastStore()
const loading = ref(true)
const assets = ref([])
const nlAssets = ref([])
const nlQuery = ref('')
const nlFilters = ref(null)
const nlLoading = ref(false)
const search = ref('')
const filterType = ref('')
const filterStatus = ref('')
const meta = ref({
  total: 0,
  per_page: 15,
  current_page: 1,
  last_page: 1,
})

const filteredAssets = computed(() => {
  return assets.value.filter((asset) => {
    const matchSearch =
      asset.original_name.toLowerCase().includes(search.value.toLowerCase()) ||
      (asset.metadata?.title ?? '').toLowerCase().includes(search.value.toLowerCase())
    const matchType = filterType.value === '' || asset.mime_type.startsWith(filterType.value)
    const matchStatus = filterStatus.value === '' || asset.status === filterStatus.value
    return matchSearch && matchType && matchStatus
  })
})

const displayedAssets = computed(() => {
  return nlFilters.value ? nlAssets.value : filteredAssets.value
})

async function handleNLSearch() {
  if (!nlQuery.value) return
  nlLoading.value = true

  try {
    const response = await api.post('/search', { query: nlQuery.value })
    nlAssets.value = response.data.data
    nlFilters.value = response.data.filters
    toast.success(`IA encontró ${response.data.total} resultado(s)`)
  } catch (e) {
    if (e.response?.status === 503) {
      toast.error('La IA está ocupada. Espera unos segundos e inténtalo de nuevo.')
    } else {
      toast.error('Error en la búsqueda inteligente.')
    }
    nlFilters.value = null
    nlAssets.value = []
  } finally {
    nlLoading.value = false
  }
}

function clearNLSearch() {
  nlQuery.value = ''
  nlFilters.value = null
  nlAssets.value = []
}

async function fetchAssets(page = 1) {
  loading.value = true
  try {
    const response = await api.get(`/assets?page=${page}`)
    assets.value = response.data.data
    meta.value = response.data.meta
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  if (page < 1 || page > meta.value.last_page) return
  fetchAssets(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => fetchAssets())
</script>
