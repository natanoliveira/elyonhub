'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-dialog'
import api from '@/lib/api'
import { toast } from 'sonner'
import { useState } from 'react'

const reports = [
  { key: 'leads', label: 'Relatório de Leads', description: 'Lista completa de leads com etapa, vendedor e data' },
  { key: 'conversion', label: 'Relatório de Conversão', description: 'Funil de conversão com percentuais por etapa' },
  { key: 'sales', label: 'Relatório de Vendas', description: 'Leads fechados no período com vendedor responsável' },
]

export default function ReportsPage() {
  const confirm = useConfirm()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function downloadPDF(type: string, label: string) {
    const ok = await confirm({
      title: 'Gerar relatório',
      description: `Deseja baixar o "${label}"?`,
      confirmLabel: 'Baixar PDF',
    })
    if (!ok) return

    setPendingKey(type)
    startTransition(async () => {
      try {
        const res = await api.get(`/reports/${type}`, {
          params: { from: from || undefined, to: to || undefined },
          responseType: 'blob',
        })
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-${new Date().toISOString().split('T')[0]}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('PDF baixado com sucesso!')
      } catch {
        toast.error('Erro ao gerar relatório')
      } finally {
        setPendingKey(null)
      }
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input label="Data início" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Data fim" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.key} className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-foreground">{r.label}</p>
              <p className="text-sm text-gray-500 mt-1">{r.description}</p>
            </div>
            <Button
              variant="outline"
              loading={isPending && pendingKey === r.key}
              onClick={() => downloadPDF(r.key, r.label)}
              className="w-full"
            >
              Baixar PDF
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
