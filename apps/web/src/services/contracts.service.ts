import api from '@/lib/api'

export const contractsService = {
  async list(params?: Record<string, any>) {
    const res = await api.get('/contracts', { params })
    return res.data.data
  },
  async get(id: string) {
    const res = await api.get(`/contracts/${id}`)
    return res.data.data
  },
  async create(data: any) {
    const res = await api.post('/contracts', data)
    return res.data.data
  },
  async update(id: string, data: any) {
    const res = await api.patch(`/contracts/${id}`, data)
    return res.data.data
  },
}
