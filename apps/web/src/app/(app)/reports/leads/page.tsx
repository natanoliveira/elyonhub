'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { leadsService } from '@/services/leads.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useExportPDF } from '@/hooks/useExportPDF'
import { PIPELINE_STAGE_LABELS, PipelineStage } from '@elyonhub/types'
import { formatPhoneBR, formatDateBR } from '@elyonhub/utils'
import { ChevronLeft, Download } from 'lucide-react'

const LEAD_STATUS_LABELS: Record<string, string> = { ACTIVE: 'Ativo', CLOSED: 'Fechado', LOST: 'Perdido' }
const LEAD_STATUS_VARIANT: Record<string, any> = { ACTIVE: 'success', CLOSED: 'secondary', LOST: 'destructive' }
const STAGE_VARIANT: Record<string, any> = {
  NEW: 'secondary', CONTACT: 'warning', NEGOTIATION: 'warning',
  PROPOSAL: 'secondary', CLOSED: 'success', LOST: 'destructive',
}

export default function LeadsReportPage() {
  const { exportPDF, isPending } = useExportPDF()
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['report-leads', search, stage, status],
    queryFn: () => leadsService.list({ search: search || undefined, stage: stage || undefined }),
  })

  const leads: any[] = data?.data ?? data ?? []

  function handleExport() {
    exportPDF('/reports/leads', `leads-${new Date().toISOString().split('T')[0]}.pdf`, {
      from, to, stage, status,
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Relatórios
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground flex-1">Relatório de Leads</h1>
        <Button size="sm" variant="outline" onClick={handleExport} loading={isPending}>
          <Download className="h-4 w-4 mr-1" /> Exportar PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Input
          placeholder="Buscar nome/telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-2 sm:col-span-1"
        />
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Todas as etapas</option>
          {Object.entries(PIPELINE_STAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Input type="date" placeholder="De" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" placeholder="Até" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{leads.length} registro(s) encontrado(s)</p>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {['Nome', 'Telefone', 'Etapa', 'Status', 'Vendedor', 'Criado em'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nenhum lead encontrado</td></tr>
                ) : leads.map((l: any) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatPhoneBR(l.phone)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STAGE_VARIANT[l.pipelineStage] ?? 'secondary'}>
                        {PIPELINE_STAGE_LABELS[l.pipelineStage as PipelineStage]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={LEAD_STATUS_VARIANT[l.status] ?? 'secondary'}>
                        {LEAD_STATUS_LABELS[l.status] ?? l.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{l.assignedUser?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateBR(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {leads.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhum lead encontrado</p>
            ) : leads.map((l: any) => (
              <div key={l.id} className="rounded-lg border bg-white p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{l.name}</p>
                  <Badge variant={STAGE_VARIANT[l.pipelineStage] ?? 'secondary'}>
                    {PIPELINE_STAGE_LABELS[l.pipelineStage as PipelineStage]}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{formatPhoneBR(l.phone)}</p>
                <div className="flex gap-2 flex-wrap pt-1">
                  <Badge variant={LEAD_STATUS_VARIANT[l.status] ?? 'secondary'}>
                    {LEAD_STATUS_LABELS[l.status] ?? l.status}
                  </Badge>
                  {l.assignedUser && <span className="text-xs text-gray-400">{l.assignedUser.name}</span>}
                  <span className="text-xs text-gray-400">{formatDateBR(l.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
