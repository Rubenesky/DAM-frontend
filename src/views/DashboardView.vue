<template>
  <AppLayout>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>

      <!-- Tarjetas de estadísticas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow p-6">
          <p class="text-sm text-gray-500">Total assets</p>
          <p class="text-4xl font-bold text-gray-800 mt-1">{{ stats.total }}</p>
        </div>
        <div class="bg-white rounded-xl shadow p-6">
          <p class="text-sm text-gray-500">Procesados</p>
          <p class="text-4xl font-bold text-green-600 mt-1">{{ stats.processed }}</p>
        </div>
        <div class="bg-white rounded-xl shadow p-6">
          <p class="text-sm text-gray-500">Pendientes</p>
          <p class="text-4xl font-bold text-yellow-500 mt-1">{{ stats.pending }}</p>
        </div>
      </div>

      <!-- Assets recientes -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="font-semibold text-gray-800 mb-4">Assets recientes</h2>
        <div v-if="loading" class="text-gray-400 text-sm">Cargando...</div>
        <div v-else-if="recentAssets.length === 0" class="text-gray-400 text-sm">
          No hay assets todavía.
        </div>
        <ul v-else class="divide-y divide-gray-100">
          <li
            v-for="asset in recentAssets"
            :key="asset.id"
            class="py-3 flex justify-between items-center text-sm"
          >
            <div>
              <span class="font-medium text-gray-800">
                {{ asset.metadata?.title ?? asset.original_name }}
              </span>
              <span class="text-gray-400 ml-2">— {{ asset.uploaded_by }}</span>
            </div>
            <span class="text-gray-400">{{ asset.size_kb }} KB</span>
          </li>
        </ul>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/axios'

const loading = ref(true)
const recentAssets = ref([])
const stats = ref({ total: 0, processed: 0, pending: 0 })

onMounted(async () => {
  try {
    const response = await api.get('/assets')
    const assets = response.data.data

    recentAssets.value = assets.slice(0, 5)
    stats.value.total = response.data.meta.total
    stats.value.processed = assets.filter((a) => a.status === 'processed').length
    stats.value.pending = assets.filter((a) => a.status === 'pending').length
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
