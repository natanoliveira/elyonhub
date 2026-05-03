import api from '@/lib/api'

export const conversationsService = {
  async list() {
    const res = await api.get('/conversations')
    return res.data.data
  },
  async get(id: string, page?: number) {
    const res = await api.get(`/conversations/${id}`, { params: { page } })
    return res.data.data
  },
  async sendMessage(conversationId: string, body: string) {
    const res = await api.post('/messages/send', { conversationId, body })
    return res.data.data
  },
}
