'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { financeService } from '@/services/finance.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useExportPDF } from '@/hooks/useExportPDF'
import { formatCurrencyBRL, formatDateBR } from '@elyonhub/utils'
import {
  FinanceType, FinanceStatus,
  FINANCE_TYPE_LABELS, FINANCE_STATUS_LABELS,
} from '@elyonhub/types'
import { ChevronLeft, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FinanceReportPage() {
  const { exportPDF, isPending } = useExportPDF()
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['report-finance', filterType, filterStatus, from, to],
    queryFn: () =>
      financeService.list({
        type: filterType || undefined,
        status: filterStatus || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  })

  const records: any[] = data?.data ?? []
  const summary = data?.summary ?? { income: 0, expense: 0, balance: 0 }

  function handleExport() {
    exportPDF('/reports/finance', `financeiro-${new Date().toISOString().split('T')[0]}.pdf`, {
      from, to, type: filterType, status: filterStatus,
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
        <h1 className="text-xl font-bold text-foreground flex-1">Relatório Financeiro</h1>
        <Button size="sm" variant="outline" onClick={handleExport} loading={isPending}>
          <Download className="h-4 w-4 mr-1" /> Exportar PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(FINANCE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(FINANCE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2"><TrendingUp className="h-4 w-4 text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Receitas</p>
            <p className="font-bold text-green-600">{formatCurrencyBRL(summary.income)}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2"><TrendingDown className="h-4 w-4 text-red-500" /></div>
          <div>
            <p className="text-xs text-gray-500">Despesas</p>
            <p className="font-bold text-red-500">{formatCurrencyBRL(summary.expense)}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
          <div className={cn('rounded-full p-2', summary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100')}>
            <DollarSign className={cn('h-4 w-4', summary.balance >= 0 ? 'text-blue-600' : 'text-orange-500')} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Saldo</p>
            <p className={cn('font-bold', summary.balance >= 0 ? 'text-blue-600' : 'text-orange-500')}>
              {formatCurrencyBRL(summary.balance)}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{records.length} registro(s) encontrado(s)</p>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {['Descrição', 'Tipo', 'Categoria', 'Vencimento', 'Valor', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nenhum lançamento encontrado</td></tr>
                ) : records.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.description}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.type === 'INCOME' ? 'success' : 'destructive'}>
                        {FINANCE_TYPE_LABELS[r.type as FinanceType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.category ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateBR(r.dueDate)}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={r.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}>
                        {formatCurrencyBRL(Number(r.amount))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === 'PAID' ? 'success' : 'secondary'}>
                        {FINANCE_STATUS_LABELS[r.status as FinanceStatus]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {records.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhum lançamento encontrado</p>
            ) : records.map((r: any) => (
              <div key={r.id} className="rounded-lg border bg-white p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{r.description}</p>
                  <span className={cn('text-sm font-bold', r.type === 'INCOME' ? 'text-green-600' : 'text-red-500')}>
                    {formatCurrencyBRL(Number(r.amount))}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap pt-1">
                  <Badge variant={r.type === 'INCOME' ? 'success' : 'destructive'}>
                    {FINANCE_TYPE_LABELS[r.type as FinanceType]}
                  </Badge>
                  <Badge variant={r.status === 'PAID' ? 'success' : 'secondary'}>
                    {FINANCE_STATUS_LABELS[r.status as FinanceStatus]}
                  </Badge>
                  <span className="text-xs text-gray-400">{formatDateBR(r.dueDate)}</span>
                  {r.category && <span className="text-xs text-gray-400">{r.category}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
