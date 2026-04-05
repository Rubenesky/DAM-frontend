<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Subir asset</h1>
        <RouterLink to="/assets" class="text-gray-500 hover:underline text-sm">
          ← Volver
        </RouterLink>
      </div>

      <div class="bg-white rounded-xl shadow p-6 max-w-2xl">
        <form @submit.prevent="handleUpload">
          <!-- Zona de subida -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Archivo </label>
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
              @click="fileInput.click()"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <div v-if="!selectedFile">
                <p class="text-gray-400 text-sm">
                  Arrastra un archivo aquí o haz clic para seleccionar
                </p>
                <p class="text-gray-300 text-xs mt-1">Máximo 10MB</p>
              </div>
              <div v-else class="text-blue-600">
                <p class="font-medium">{{ selectedFile.name }}</p>
                <p class="text-sm text-gray-400 mt-1">
                  {{ (selectedFile.size / 1024).toFixed(1) }} KB
                </p>
              </div>
            </div>
            <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" />
          </div>

          <!-- Mensaje de éxito -->
          <div v-if="success" class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            ✅ Asset subido correctamente. La IA está generando los metadatos...
          </div>

          <!-- Mensaje de error -->
          <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {{ error }}
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-3">
            <RouterLink to="/assets" class="px-4 py-2 text-gray-600 hover:underline text-sm">
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
import api from '../api/axios'

const router = useRouter()
const fileInput = ref(null)
const selectedFile = ref(null)
const loading = ref(false)
const success = ref(false)
const error = ref('')

function handleFileChange(event) {
  selectedFile.value = event.target.files[0]
}

function handleDrop(event) {
  selectedFile.value = event.dataTransfer.files[0]
}

async function handleUpload() {
  if (!selectedFile.value) return

  error.value = ''
  success.value = false
  loading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    await api.post('/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    success.value = true
    selectedFile.value = null

    setTimeout(() => {
      router.push({ name: 'assets' })
    }, 2000)
  } catch (e) {
    error.value = 'Error al subir el archivo. Inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>
