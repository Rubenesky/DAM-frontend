<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Editar asset</h1>
        <RouterLink
          :to="`/assets/${route.params.id}`"
          class="text-gray-500 dark:text-gray-400 hover:underline text-sm"
        >
          ← Volver
        </RouterLink>
      </div>

      <div v-if="loading" class="text-center py-20 text-gray-400">Cargando...</div>

      <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-2xl">
        <form @submit.prevent="handleUpdate">
          <!-- Título -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título
            </label>
            <input
              v-model="form.title"
              type="text"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Descripción -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Tags -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etiquetas <span class="text-gray-400 font-normal">(separadas por comas)</span>
            </label>
            <input
              v-model="form.tags"
              type="text"
              placeholder="diseño, logo, web"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Aviso IA -->
          <div
            class="mb-6 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg text-sm text-purple-700 dark:text-purple-300"
          >
            ✨ Los metadatos actuales fueron generados por IA. Al guardar se marcarán como editados
            manualmente.
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-3">
            <RouterLink
              :to="`/assets/${route.params.id}`"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline text-sm"
            >
              Cancelar
            </RouterLink>
            <button
              type="submit"
              :disabled="saving"
              class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const loading = ref(true)
const saving = ref(false)
const form = ref({
  title: '',
  description: '',
  tags: '',
})

onMounted(async () => {
  try {
    const response = await api.get(`/assets/${route.params.id}`)
    const asset = response.data.data

    form.value.title = asset.metadata?.title ?? ''
    form.value.description = asset.metadata?.description ?? ''
    form.value.tags = asset.metadata?.tags?.join(', ') ?? ''
  } catch (e) {
    toast.error('Error al cargar el asset.')
  } finally {
    loading.value = false
  }
})

async function handleUpdate() {
  saving.value = true

  try {
    await api.patch(`/assets/${route.params.id}`, {
      title: form.value.title,
      description: form.value.description,
      tags: form.value.tags,
    })

    toast.success('Asset actualizado correctamente.')
    router.push({ name: 'asset-detail', params: { id: route.params.id } })
  } catch (e) {
    toast.error('Error al actualizar el asset.')
  } finally {
    saving.value = false
  }
}
</script>
