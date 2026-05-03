import api from '@/lib/api'

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password })
    return res.data.data as { accessToken: string; refreshToken: string; user: any }
  },
  async logout() {
    await api.post('/auth/logout').catch(() => {})
  },
}
