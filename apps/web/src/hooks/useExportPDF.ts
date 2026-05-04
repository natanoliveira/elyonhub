'use client'

import { useTransition } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

export function useExportPDF() {
  const [isPending, startTransition] = useTransition()

  function exportPDF(endpoint: string, filename: string, params?: Record<string, any>) {
    startTransition(async () => {
      try {
        const clean: Record<string, any> = {}
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null && v !== '') clean[k] = v
          }
        }
        const res = await api.get(endpoint, { params: clean, responseType: 'blob' })
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        toast.success('PDF exportado com sucesso!')
      } catch {
        toast.error('Erro ao exportar PDF')
      }
    })
  }

  return { exportPDF, isPending }
}
