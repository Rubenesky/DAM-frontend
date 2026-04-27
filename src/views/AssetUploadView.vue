<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Subir asset</h1>
        <RouterLink to="/assets" class="text-gray-500 dark:text-gray-400 hover:underline text-sm">
          ← Volver
        </RouterLink>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-2xl">
        <form @submit.prevent="handleUpload">
          <!-- Zona de subida -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Archivo
            </label>

            <!-- Vista previa si es imagen -->
            <div v-if="preview" class="mb-4 relative">
              <img
                :src="preview"
                alt="Vista previa"
                class="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                @click="clearFile"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 text-sm"
              >
                ✕
              </button>
            </div>

            <!-- Zona de drop -->
            <div
              v-if="!selectedFile"
              class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
              @click="fileInput.click()"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <p class="text-gray-400 text-sm">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p class="text-gray-300 text-xs mt-1">Máximo 10MB</p>
            </div>

            <!-- Info del archivo seleccionado (no imagen) -->
            <div
              v-else-if="selectedFile && !preview"
              class="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p class="font-medium text-blue-700 dark:text-blue-300">{{ selectedFile.name }}</p>
                <p class="text-sm text-blue-400 mt-1">
                  {{ (selectedFile.size / 1024).toFixed(1) }} KB
                </p>
              </div>
              <button
                type="button"
                @click="clearFile"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                ✕ Quitar
              </button>
            </div>

            <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" />
          </div>

          <!-- Info del archivo con imagen -->
          <div
            v-if="selectedFile && preview"
            class="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300"
          >
            <p><span class="font-medium">Nombre:</span> {{ selectedFile.name }}</p>
            <p>
              <span class="font-medium">Tamaño:</span>
              {{ (selectedFile.size / 1024).toFixed(1) }} KB
            </p>
            <p><span class="font-medium">Tipo:</span> {{ selectedFile.type }}</p>
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-3">
            <RouterLink
              to="/assets"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline text-sm"
            >
              Cancelar
            </RouterLink>
            <button
              type="submit"
              :disabled="!selectedFile || loading"
              class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {{ loading ? 'Subiendo...' : 'Subir asset' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const router = useRouter()
const toast = useToastStore()
const fileInput = ref(null)
const selectedFile = ref(null)
const preview = ref(null)
const loading = ref(false)

function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) setFile(file)
}

function handleDrop(event) {
  const file = event.dataTransfer.files[0]
  if (file) setFile(file)
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function setFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.error('Tipo de archivo no permitido. Usa imágenes, PDF, vídeo o audio.')
    return
  }
  if (file.size > MAX_SIZE_BYTES) {
    toast.error('El archivo supera el límite de 10MB.')
    return
  }
  selectedFile.value = file
  preview.value = null
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

function clearFile() {
  selectedFile.value = null
  preview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function handleUpload() {
  if (!selectedFile.value) return

  loading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await api.post('/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    if (response.data.has_duplicates) {
      const similar = response.data.similar_assets
      toast.info(
        `⚠️ Asset subido pero se detectaron ${similar.length} asset(s) similar(es). Revisa si es un duplicado.`,
      )
    } else {
      toast.success('Asset subido correctamente. La IA está generando los metadatos...')
    }

    clearFile()

    setTimeout(() => {
      router.push({ name: 'assets' })
    }, 2000)
  } catch (e) {
    if (e.response?.status === 409) {
      toast.error('❌ Este archivo exacto ya existe en la plataforma. No se ha subido.')
    } else if (e.response?.status === 503) {
      toast.error('La IA está ocupada. Espera unos segundos e inténtalo de nuevo.')
    } else {
      toast.error('Error al subir el archivo. Inténtalo de nuevo.')
    }
  }
}
</script>
