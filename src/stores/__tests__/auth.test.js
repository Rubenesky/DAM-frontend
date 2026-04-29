import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import { useAuthStore } from '../auth'
import api from '../../api/axios'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('login guarda token y user en el store', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token-123',
        user: { id: 1, name: 'Ruben', email: 'r@test.com', role: 'admin' },
      },
    })

    const auth = useAuthStore()
    await auth.login('r@test.com', 'password')

    expect(auth.token).toBe('fake-token-123')
    expect(auth.user.role).toBe('admin')
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe('fake-token-123')
  })

  it('logout limpia token, user e isAuthenticated', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'tk', user: { id: 1, name: 'R', email: 'r@t.com', role: 'admin' } },
    })
    api.post.mockResolvedValueOnce({})

    const auth = useAuthStore()
    await auth.login('r@t.com', 'pass')
    await auth.logout()

    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('isAuthenticated es true con token y false sin él', () => {
    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(false)
    auth.token = 'some-token'
    expect(auth.isAuthenticated).toBe(true)
  })
})
