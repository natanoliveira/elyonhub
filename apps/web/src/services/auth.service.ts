import api from '@/lib/api'

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password })
    return res.data.data as { accessToken: string; refreshToken: string; user: any }
  },
  async logout() {
    await api.post('/auth/logout').catch(() => {})
  },
  async register(data: {
    companyName: string
    emailDomain: string
    name: string
    email: string
    password: string
    planId: string
  }) {
    const res = await api.post('/auth/register', data)
    return res.data.data as { message: string }
  },
  async confirmEmail(token: string) {
    const res = await api.get(`/auth/confirm-email?token=${token}`)
    return res.data.data as { message: string }
  },
  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data.data as { message: string }
  },
  async resetPassword(token: string, password: string) {
    const res = await api.post('/auth/reset-password', { token, password })
    return res.data.data as { message: string }
  },
  async validateDomain(domain: string) {
    const res = await api.get(`/auth/validate-domain?domain=${domain}`)
    return res.data.data as { valid: boolean; reason?: string }
  },
}
