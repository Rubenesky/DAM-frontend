<template>
  <AppLayout>
    <div v-if="loading" class="text-center py-20 text-gray-400">Cargando...</div>

    <div v-else-if="!asset" class="text-center py-20 text-gray-400">Asset no encontrado.</div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {{ asset.metadata?.title ?? asset.original_name }}
        </h1>
        <div class="flex gap-3">
          <RouterLink
            :to="`/assets/${asset.id}/edit`"
            class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
          >
            Editar
          </RouterLink>
          <button
            v-if="auth.isAdmin"
            @click="handleDelete"
            class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Eliminar
          </button>
          <RouterLink to="/assets" class="text-gray-500 dark:text-gray-400 hover:underline text-sm">
            ← Volver
          </RouterLink>
        </div>
      </div>

      <!-- Previsualización -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <img
          v-if="asset.mime_type.startsWith('image/')"
          :src="asset.url"
          :alt="asset.original_name"
          class="max-h-96 mx-auto rounded-lg"
        />
        <div
          v-else
          class="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-700 rounded-lg"
        >
          <span class="text-6xl">📄</span>
        </div>
      </div>

      <!-- Información y Metadatos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 class="font-semibold text-gray-800 dark:text-gray-200 mb-4">Información</h2>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Nombre original</dt>
              <dd class="text-gray-800 dark:text-gray-200 font-medium">
                {{ asset.original_name }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Tipo</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ asset.mime_type }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Tamaño</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ asset.size_kb }} KB</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Subido por</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ asset.uploaded_by }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Estado</dt>
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
              <dt class="text-gray-500 dark:text-gray-400">Fecha</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ formatDate(asset.created_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Metadatos IA -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6" v-if="asset.metadata">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-800 dark:text-gray-200">Metadatos</h2>
            <span
              v-if="asset.metadata.ai_generated"
              class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full"
            >
              ✨ Generado por IA
            </span>
          </div>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-gray-500 dark:text-gray-400 mb-1">Título</dt>
              <dd class="text-gray-800 dark:text-gray-200 font-medium">
                {{ asset.metadata.title ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400 mb-1">Descripción</dt>
              <dd class="text-gray-800 dark:text-gray-200">
                {{ asset.metadata.description ?? '—' }}
              </dd>
            </div>
            <div v-if="asset.metadata.tags?.length">
              <dt class="text-gray-500 dark:text-gray-400 mb-2">Etiquetas</dt>
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

      <!-- Generador de variantes con IA -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="font-semibold text-gray-800 dark:text-gray-200">🧠 Sugerencias de IA</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              La IA puede sugerirte títulos alternativos, descripciones mejoradas y tags
              adicionales.
            </p>
          </div>
          <button
            @click="generateVariants"
            :disabled="variantsLoading"
            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
          >
            {{ variantsLoading ? 'Generando...' : '✨ Generar sugerencias' }}
          </button>
        </div>

        <!-- Variantes generadas -->
        <div v-if="variants" class="space-y-4">
          <!-- Títulos alternativos -->
          <div v-if="variants.titles?.length">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Títulos alternativos
            </h3>
            <div class="space-y-2">
              <div
                v-for="(title, i) in variants.titles"
                :key="i"
                class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span class="text-sm text-gray-800 dark:text-gray-200">{{ title }}</span>
                <button
                  @click="applyVariant('title', title)"
                  class="text-xs text-blue-600 hover:underline ml-2 shrink-0"
                >
                  Usar este
                </button>
              </div>
            </div>
          </div>

          <!-- Descripciones mejoradas -->
          <div v-if="variants.descriptions?.length">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripciones mejoradas
            </h3>
            <div class="space-y-2">
              <div
                v-for="(desc, i) in variants.descriptions"
                :key="i"
                class="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span class="text-sm text-gray-800 dark:text-gray-200">{{ desc }}</span>
                <button
                  @click="applyVariant('description', desc)"
                  class="text-xs text-blue-600 hover:underline ml-2 shrink-0"
                >
                  Usar esta
                </button>
              </div>
            </div>
          </div>

          <!-- Tags adicionales -->
          <div v-if="variants.additional_tags?.length">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags adicionales sugeridos
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in variants.additional_tags"
                :key="tag"
                @click="applyTag(tag)"
                class="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full hover:bg-purple-200 transition"
              >
                + {{ tag }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              Haz clic en un tag para añadirlo a los metadatos
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const loading = ref(true)
const asset = ref(null)
const variants = ref(null)
const variantsLoading = ref(false)

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleDelete() {
  if (!confirm('¿Seguro que quieres eliminar este asset?')) return

  try {
    await api.delete(`/assets/${route.params.id}`)
    toast.success('Asset eliminado correctamente.')
    router.push({ name: 'assets' })
  } catch (e) {
    toast.error('Error al eliminar el asset.')
  }
}

async function generateVariants() {
  variantsLoading.value = true
  variants.value = null

  try {
    const response = await api.post(`/assets/${route.params.id}/variants`)
    variants.value = response.data.variants
    toast.success('Sugerencias generadas correctamente.')
  } catch (e) {
    toast.error('Error al generar sugerencias. Inténtalo de nuevo.')
  } finally {
    variantsLoading.value = false
  }
}

async function applyVariant(field, value) {
  try {
    const currentTags = asset.value.metadata?.tags?.join(', ') ?? ''
    await api.patch(`/assets/${route.params.id}`, {
      title: field === 'title' ? value : asset.value.metadata?.title,
      description: field === 'description' ? value : asset.value.metadata?.description,
      tags: currentTags,
    })

    // Actualizamos el asset en local
    if (field === 'title') asset.value.metadata.title = value
    if (field === 'description') asset.value.metadata.description = value

    toast.success('Metadato actualizado correctamente.')
  } catch (e) {
    toast.error('Error al aplicar la sugerencia.')
  }
}

async function applyTag(tag) {
  try {
    const currentTags = asset.value.metadata?.tags ?? []
    if (currentTags.includes(tag)) {
      toast.info('Ese tag ya existe en los metadatos.')
      return
    }

    const newTags = [...currentTags, tag]
    await api.patch(`/assets/${route.params.id}`, {
      title: asset.value.metadata?.title,
      description: asset.value.metadata?.description,
      tags: newTags.join(', '),
    })

    asset.value.metadata.tags = newTags
    toast.success(`Tag "${tag}" añadido correctamente.`)
  } catch (e) {
    toast.error('Error al añadir el tag.')
  }
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
