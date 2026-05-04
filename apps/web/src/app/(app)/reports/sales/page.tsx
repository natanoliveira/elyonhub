'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { leadsService } from '@/services/leads.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useExportPDF } from '@/hooks/useExportPDF'
import { formatPhoneBR, formatDateBR } from '@elyonhub/utils'
import { ChevronLeft, Download } from 'lucide-react'

export default function SalesReportPage() {
  const { exportPDF, isPending } = useExportPDF()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['report-sales'],
    queryFn: () => leadsService.list({ status: 'CLOSED' }),
  })

  const leads: any[] = data?.data ?? data ?? []

  function handleExport() {
    exportPDF('/reports/sales', `vendas-${new Date().toISOString().split('T')[0]}.pdf`, { from, to })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Relatórios
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground flex-1">Relatório de Vendas</h1>
        <Button size="sm" variant="outline" onClick={handleExport} loading={isPending}>
          <Download className="h-4 w-4 mr-1" /> Exportar PDF
        </Button>
      </div>

      {/* Date range — used for PDF export */}
      <div className="flex gap-2">
        <Input type="date" placeholder="De" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <Input type="date" placeholder="Até" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        <p className="self-center text-xs text-gray-400">Período aplicado na exportação PDF</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{leads.length} venda(s) fechada(s)</p>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {['Cliente', 'Telefone', 'Vendedor', 'Data de Fechamento'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Nenhuma venda encontrada</td></tr>
                ) : leads.map((l: any) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatPhoneBR(l.phone)}</td>
                    <td className="px-4 py-3 text-gray-500">{l.assignedUser?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateBR(l.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {leads.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhuma venda encontrada</p>
            ) : leads.map((l: any) => (
              <div key={l.id} className="rounded-lg border bg-white p-4 space-y-1">
                <p className="font-medium">{l.name}</p>
                <p className="text-xs text-gray-500">{formatPhoneBR(l.phone)}</p>
                <div className="flex gap-3 text-xs text-gray-400">
                  {l.assignedUser && <span>{l.assignedUser.name}</span>}
                  <span>Fechado: {formatDateBR(l.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
