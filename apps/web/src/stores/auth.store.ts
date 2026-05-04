import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  name: string
  email: string
  role: 'MASTER' | 'ADMIN' | 'SELLER'
  companyId: string
}

interface AuthStore {
  user: AuthUser | null
  allowedMenus: string[]
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setAllowedMenus: (menus: string[]) => void
  clearAuth: () => void
  isAdmin: () => boolean
  isMaster: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      allowedMenus: [],
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken })
      },
      setAllowedMenus: (menus) => set({ allowedMenus: menus }),
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, allowedMenus: [], accessToken: null, refreshToken: null })
      },
      isAdmin: () => {
        const role = get().user?.role
        return role === 'ADMIN' || role === 'MASTER'
      },
      isMaster: () => get().user?.role === 'MASTER',
    }),
    { name: 'elyon-auth', partialize: (s) => ({ user: s.user, allowedMenus: s.allowedMenus }) },
  ),
)
