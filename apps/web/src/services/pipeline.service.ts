import api from '@/lib/api'

export const pipelineService = {
  async getBoard() {
    const res = await api.get('/pipeline')
    return res.data.data
  },
  async moveStage(leadId: string, stage: string) {
    const res = await api.patch(`/pipeline/${leadId}/stage`, { stage })
    return res.data.data
  },
  async getHistory(leadId: string) {
    const res = await api.get(`/pipeline/${leadId}/history`)
    return res.data.data
  },
}
