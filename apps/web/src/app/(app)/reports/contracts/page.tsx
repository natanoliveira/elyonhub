'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { contractsService } from '@/services/contracts.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useExportPDF } from '@/hooks/useExportPDF'
import { formatCurrencyBRL, formatDateBR, formatPhoneBR } from '@elyonhub/utils'
import {
  ContractStatus, PaymentType,
  CONTRACT_STATUS_LABELS, PAYMENT_TYPE_LABELS,
} from '@elyonhub/types'
import { ChevronLeft, Download } from 'lucide-react'

const STATUS_VARIANT: Record<ContractStatus, 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  PENDING: 'secondary',
  CANCELED: 'destructive',
}

export default function ContractsReportPage() {
  const { exportPDF, isPending } = useExportPDF()
  const [filterStatus, setFilterStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['report-contracts', filterStatus, from, to],
    queryFn: () =>
      contractsService.list({
        status: filterStatus || undefined,
      }),
  })

  const list: any[] = Array.isArray(contracts) ? contracts : []
  const totalValue = list.reduce((s, c) => s + Number(c.contractValue), 0)

  function handleExport() {
    exportPDF('/reports/contracts', `contratos-${new Date().toISOString().split('T')[0]}.pdf`, {
      from, to, status: filterStatus,
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
        <h1 className="text-xl font-bold text-foreground flex-1">Relatório de Contratos</h1>
        <Button size="sm" variant="outline" onClick={handleExport} loading={isPending}>
          <Download className="h-4 w-4 mr-1" /> Exportar PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(CONTRACT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {/* Summary */}
      {!isLoading && (
        <div className="flex flex-wrap gap-4 rounded-lg border bg-white px-5 py-3">
          <div>
            <p className="text-xs text-gray-500">Total de contratos</p>
            <p className="font-bold text-foreground">{list.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Valor total</p>
            <p className="font-bold text-primary">{formatCurrencyBRL(totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ativos</p>
            <p className="font-bold text-green-600">{list.filter((c) => c.status === 'ACTIVE').length}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{list.length} registro(s) encontrado(s)</p>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {['Cliente', 'CPF/CNPJ', 'Telefone', 'Pagamento', 'Início', 'Valor', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Nenhum contrato encontrado</td></tr>
                ) : list.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.clientName}</td>
                    <td className="px-4 py-3 text-gray-500">{c.document ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatPhoneBR(c.phone)}</td>
                    <td className="px-4 py-3 text-gray-500">{PAYMENT_TYPE_LABELS[c.paymentType as PaymentType]}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateBR(c.startDate)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrencyBRL(Number(c.contractValue))}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[c.status as ContractStatus]}>
                        {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {list.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhum contrato encontrado</p>
            ) : list.map((c: any) => (
              <div key={c.id} className="rounded-lg border bg-white p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{c.clientName}</p>
                  <Badge variant={STATUS_VARIANT[c.status as ContractStatus]}>
                    {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
                  </Badge>
                </div>
                <p className="font-semibold text-foreground">{formatCurrencyBRL(Number(c.contractValue))}</p>
                <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                  {c.document && <span>{c.document}</span>}
                  <span>{formatPhoneBR(c.phone)}</span>
                  <span>{PAYMENT_TYPE_LABELS[c.paymentType as PaymentType]}</span>
                  <span>Início: {formatDateBR(c.startDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
