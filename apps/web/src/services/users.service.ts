import api from '@/lib/api'

export interface UserDto {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'SELLER'
  active: boolean
  createdAt: string
}

export const usersService = {
  list: (): Promise<UserDto[]> =>
    api.get('/users').then((r) => r.data.data),

  create: (dto: { name: string; email: string; password: string; role: 'ADMIN' | 'SELLER' }): Promise<UserDto> =>
    api.post('/users', dto).then((r) => r.data.data),

  update: (id: string, dto: { name?: string; role?: 'ADMIN' | 'SELLER' }): Promise<UserDto> =>
    api.patch(`/users/${id}`, dto).then((r) => r.data.data),

  deactivate: (id: string): Promise<void> =>
    api.delete(`/users/${id}`).then((r) => r.data.data),

  reactivate: (id: string): Promise<UserDto> =>
    api.patch(`/users/${id}`, { active: true }).then((r) => r.data.data),
}
