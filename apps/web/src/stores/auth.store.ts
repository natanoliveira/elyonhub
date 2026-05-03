import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'SELLER'
  companyId: string
}

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null })
      },
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    { name: 'elyon-auth', partialize: (s) => ({ user: s.user }) },
  ),
)
