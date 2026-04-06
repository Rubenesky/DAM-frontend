import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function add(message, type = 'success', duration = 3000) {
    const id = Date.now()
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }

  function success(message) {
    add(message, 'success')
  }
  function error(message) {
    add(message, 'error')
  }
  function info(message) {
    add(message, 'info')
  }

  return { toasts, success, error, info }
})
