import api from '@/lib/api'

export const leadsService = {
  async list(params?: Record<string, any>) {
    const res = await api.get('/leads', { params })
    return res.data.data
  },
  async get(id: string) {
    const res = await api.get(`/leads/${id}`)
    return res.data.data
  },
  async create(data: any) {
    const res = await api.post('/leads', data)
    return res.data.data
  },
  async update(id: string, data: any) {
    const res = await api.patch(`/leads/${id}`, data)
    return res.data.data
  },
}
