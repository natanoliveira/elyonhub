'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { dashboardService } from '@/services/dashboard.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useExportPDF } from '@/hooks/useExportPDF'
import { PIPELINE_STAGE_LABELS, PipelineStage } from '@elyonhub/types'
import { ChevronLeft, Download } from 'lucide-react'

export default function ConversionReportPage() {
  const { exportPDF, isPending } = useExportPDF()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['report-conversion', from, to],
    queryFn: () => dashboardService.getMetrics(from || undefined, to || undefined),
  })

  const stageMap: Record<string, number> = metrics?.leadsByStage ?? {}
  const total = Object.values(stageMap).reduce((s, v) => s + v, 0)

  const rows = Object.values(PipelineStage).map((stage) => ({
    stage,
    label: PIPELINE_STAGE_LABELS[stage],
    count: stageMap[stage] ?? 0,
    pct: total > 0 ? (((stageMap[stage] ?? 0) / total) * 100).toFixed(1) : '0.0',
  }))

  function handleExport() {
    exportPDF('/reports/conversion', `conversao-${new Date().toISOString().split('T')[0]}.pdf`, { from, to })
  }

  const STAGE_BAR_COLORS: Record<string, string> = {
    NEW: 'bg-blue-400',
    CONTACT: 'bg-yellow-400',
    NEGOTIATION: 'bg-orange-400',
    PROPOSAL: 'bg-purple-400',
    CLOSED: 'bg-green-500',
    LOST: 'bg-red-400',
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Relatórios
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground flex-1">Relatório de Conversão</h1>
        <Button size="sm" variant="outline" onClick={handleExport} loading={isPending}>
          <Download className="h-4 w-4 mr-1" /> Exportar PDF
        </Button>
      </div>

      {/* Date range */}
      <div className="flex gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <>
          <p className="text-xs text-gray-400">Total de leads no período: {total}</p>

          {/* Visual funnel */}
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.stage} className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{r.count}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">{r.pct}%</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${STAGE_BAR_COLORS[r.stage] ?? 'bg-gray-400'}`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Etapa</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Quantidade</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.stage} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.label}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.count}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.pct}%</td>
                  </tr>
                ))}
                <tr className="bg-muted/20 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{total}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
