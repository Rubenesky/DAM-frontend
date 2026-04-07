<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">🧠 Chat con tus datos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pregúntale a la IA cualquier cosa sobre los assets y usuarios de la plataforma.
        </p>
      </div>

      <!-- Historial de chat -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-96 space-y-4">
        <div v-if="messages.length === 0" class="text-center py-16 text-gray-400">
          <p class="text-4xl mb-3">🤖</p>
          <p class="text-sm">Haz una pregunta sobre tus datos</p>
          <div class="mt-4 space-y-2">
            <button
              v-for="example in examples"
              :key="example"
              @click="askExample(example)"
              class="block w-full text-left text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="i">
          <!-- Pregunta del usuario -->
          <div class="flex justify-end">
            <div
              class="bg-blue-600 text-white px-4 py-2 rounded-xl rounded-tr-none max-w-md text-sm"
            >
              {{ msg.question }}
            </div>
          </div>
          <!-- Respuesta de la IA -->
          <div class="flex justify-start mt-2">
            <div
              class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl rounded-tl-none max-w-md text-sm"
            >
              <span class="text-purple-600 dark:text-purple-400 font-medium">✨ IA: </span>
              {{ msg.answer }}
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-start">
          <div
            class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl rounded-tl-none text-sm text-gray-400"
          >
            Consultando datos...
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="flex gap-3">
        <input
          v-model="question"
          type="text"
          placeholder="¿Cuántos assets subí esta semana?"
          class="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleQuery"
        />
        <button
          @click="handleQuery"
          :disabled="loading || !question"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          Preguntar
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const toast = useToastStore()
const question = ref('')
const loading = ref(false)
const messages = ref([])

const examples = [
  '¿Cuántos assets tengo subidos en la plataforma?',
  '¿Qué assets subí esta semana?',
  '¿Cuántos usuarios hay y qué roles tienen?',
  '¿Cuál es el espacio total ocupado?',
  '¿Cuál es el usuario más activo?',
]

async function handleQuery() {
  if (!question.value || loading.value) return

  const userQuestion = question.value
  question.value = ''
  loading.value = true

  try {
    const response = await api.post('/rag', { question: userQuestion })
    messages.value.push({
      question: userQuestion,
      answer: response.data.answer,
    })
  } catch (e) {
    toast.error('Error al consultar la IA. Inténtalo de nuevo.')
  } finally {
    loading.value = false
  }
}

function askExample(example) {
  question.value = example
  handleQuery()
}
</script>
