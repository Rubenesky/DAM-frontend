<template>
  <AppLayout>
    <div v-if="loading" class="text-center py-20 text-gray-400">Cargando...</div>

    <div v-else-if="!asset" class="text-center py-20 text-gray-400">Asset no encontrado.</div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">
          {{ asset.metadata?.title ?? asset.original_name }}
        </h1>
        <RouterLink to="/assets" class="text-gray-500 hover:underline text-sm">
          ← Volver
        </RouterLink>
      </div>

      <!-- Previsualización -->
      <div class="bg-white rounded-xl shadow p-6">
        <img
          v-if="asset.mime_type.startsWith('image/')"
          :src="asset.url"
          :alt="asset.original_name"
          class="max-h-96 mx-auto rounded-lg"
        />
        <div v-else class="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
          <span class="text-6xl">📄</span>
        </div>
      </div>

      <!-- Información -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow p-6">
          <h2 class="font-semibold text-gray-800 mb-4">Información</h2>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Nombre original</dt>
              <dd class="text-gray-800 font-medium">{{ asset.original_name }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Tipo</dt>
              <dd class="text-gray-800">{{ asset.mime_type }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Tamaño</dt>
              <dd class="text-gray-800">{{ asset.size_kb }} KB</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Subido por</dt>
              <dd class="text-gray-800">{{ asset.uploaded_by }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Estado</dt>
              <dd>
                <span
                  v-if="asset.status === 'processed'"
                  class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
                >
                  Procesado
                </span>
                <span v-else class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Pendiente
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Fecha</dt>
              <dd class="text-gray-800">{{ formatDate(asset.created_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Metadatos IA -->
        <div class="bg-white rounded-xl shadow p-6" v-if="asset.metadata">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-800">Metadatos</h2>
            <span
              v-if="asset.metadata.ai_generated"
              class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full"
            >
              ✨ Generado por IA
            </span>
          </div>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-gray-500 mb-1">Título</dt>
              <dd class="text-gray-800 font-medium">{{ asset.metadata.title ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 mb-1">Descripción</dt>
              <dd class="text-gray-800">{{ asset.metadata.description ?? '—' }}</dd>
            </div>
            <div v-if="asset.metadata.tags?.length">
              <dt class="text-gray-500 mb-2">Etiquetas</dt>
              <dd class="flex flex-wrap gap-2">
                <span
                  v-for="tag in asset.metadata.tags"
                  :key="tag"
                  class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {{ tag }}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/axios'

const route = useRoute()
const loading = ref(true)
const asset = ref(null)

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  try {
    const response = await api.get(`/assets/${route.params.id}`)
    asset.value = response.data.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
