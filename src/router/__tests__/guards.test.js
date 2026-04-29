import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

function runGuard(to, authToken) {
  const auth = useAuthStore()
  auth.token = authToken

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return undefined
}

describe('Router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('ruta protegida sin token redirige a /login', () => {
    const result = runGuard({ meta: { requiresAuth: true } }, null)
    expect(result).toEqual({ name: 'login' })
  })

  it('ruta protegida con token permite el acceso', () => {
    const result = runGuard({ meta: { requiresAuth: true } }, 'valid-token')
    expect(result).toBeUndefined()
  })

  it('ruta guest con token redirige a /dashboard', () => {
    const result = runGuard({ meta: { guest: true } }, 'valid-token')
    expect(result).toEqual({ name: 'dashboard' })
  })
})
