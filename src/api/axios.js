import axios from 'axios'
import { useToastStore } from '../stores/toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Interceptor — añade el token automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor — maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const toast = useToastStore()

    if (!error.response) {
      // Sin conexión con el servidor
      toast.error('No se puede conectar con el servidor. Comprueba tu conexión.')
    } else if (error.response.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      toast.error('Tu sesión ha expirado. Inicia sesión de nuevo.')
      window.location.href = '/login'
    } else if (error.response.status === 403) {
      toast.error('No tienes permiso para realizar esta acción.')
    } else if (error.response.status === 404) {
      toast.error('El recurso solicitado no existe.')
    } else if (error.response.status === 422) {
      // Errores de validación
      const errors = error.response.data.errors
      if (errors) {
        const firstError = Object.values(errors)[0][0]
        toast.error(firstError)
      } else {
        toast.error('Datos incorrectos. Revisa el formulario.')
      }
    } else if (error.response.status >= 500) {
      toast.error('Error en el servidor. Inténtalo de nuevo más tarde.')
    }

    return Promise.reject(error)
  },
)

export default api
