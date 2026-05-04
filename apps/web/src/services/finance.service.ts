import api from '@/lib/api'

export const financeService = {
  async list(params?: Record<string, any>) {
    const res = await api.get('/finance', { params })
    return res.data.data
  },
  async create(data: any) {
    const res = await api.post('/finance', data)
    return res.data.data
  },
  async update(id: string, data: any) {
    const res = await api.patch(`/finance/${id}`, data)
    return res.data.data
  },
  async remove(id: string) {
    const res = await api.delete(`/finance/${id}`)
    return res.data.data
  },
  async addPayment(financeId: string, data: { amount: number; method: string; paidAt?: string; notes?: string }) {
    const res = await api.post(`/finance/${financeId}/payments`, data)
    return res.data.data
  },
  async removePayment(financeId: string, paymentId: string) {
    const res = await api.delete(`/finance/${financeId}/payments/${paymentId}`)
    return res.data.data
  },
}
