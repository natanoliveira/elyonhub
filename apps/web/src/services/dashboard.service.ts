import api from '@/lib/api'

export const dashboardService = {
  async getMetrics(from?: string, to?: string) {
    const res = await api.get('/dashboard', { params: { from, to } })
    return res.data.data
  },
}
