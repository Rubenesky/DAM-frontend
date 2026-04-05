<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Assets</h1>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl shadow p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nombre..."
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            v-model="filterType"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="image">Imágenes</option>
            <option value="application/pdf">PDFs</option>
          </select>
          <select
            v-model="filterStatus"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="processed">Procesado</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
      </div>

      <!-- Listado -->
      <div v-if="loading" class="text-center py-20 text-gray-400">Cargando assets...</div>

      <div v-else-if="filteredAssets.length === 0" class="text-center py-20 text-gray-400">
        No se encontraron assets.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <RouterLink
          v-for="asset in filteredAssets"
          :key="asset.id"
          :to="`/assets/${asset.id}`"
          class="bg-white rounded-xl shadow hover:shadow-lg transition p-4 block"
        >
          <!-- Previsualización -->
          <div
            class="w-full h-40 rounded-lg mb-3 overflow-hidden bg-gray-100 flex items-center justify-center"
          >
            <img
              v-if="asset.mime_type.startsWith('image/')"
              :src="asset.url"
              :alt="asset.original_name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-4xl">📄</span>
          </div>

          <p class="font-medium text-gray-800 truncate">
            {{ asset.metadata?.title ?? asset.original_name }}
          </p>
          <p class="text-sm text-gray-500 mt-1">{{ asset.uploaded_by }} · {{ asset.size_kb }} KB</p>

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
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/axios'

const loading = ref(true)
const assets = ref([])
const search = ref('')
const filterType = ref('')
const filterStatus = ref('')

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

onMounted(async () => {
  try {
    const response = await api.get('/assets')
    assets.value = response.data.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
