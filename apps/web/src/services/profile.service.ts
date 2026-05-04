import api from '@/lib/api'

export interface ProfileData {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'SELLER'
  createdAt: string
}

export const profileService = {
  getMe: (): Promise<ProfileData> =>
    api.get('/profile/me').then((r) => r.data.data),

  updateMe: (dto: { name?: string; currentPassword?: string; newPassword?: string }): Promise<ProfileData> =>
    api.patch('/profile/me', dto).then((r) => r.data.data),
}
