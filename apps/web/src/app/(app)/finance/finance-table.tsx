import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyBRL, formatDateBR } from '@elyonhub/utils'
import {
  FinanceType,
  FinanceStatusExtended,
  PaymentMethod,
  FINANCE_TYPE_LABELS,
  FINANCE_STATUS_EXTENDED_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@elyonhub/types'
import { Trash2, ChevronDown, ChevronRight, CreditCard } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { paidTotal, effectiveStatus } from './finance-utils'

const STATUS_VARIANT: Record<FinanceStatusExtended, 'success' | 'warning' | 'secondary'> = {
  PAID: 'success',
  PARTIAL: 'warning',
  PENDING: 'secondary',
}

interface Props {
  records: any[]
  onOpenPayments: (record: any) => void
  onDelete: (id: string, description: string) => void
}

export function FinanceTable({ records, onOpenPayments, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (records.length === 0) {
    return (
      <div className="hidden md:block rounded-lg border border-border bg-white">
        <p className="px-4 py-10 text-center text-gray-400">Nenhum lançamento encontrado</p>
      </div>
    )
  }

  return (
    <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 w-8" />
            <th className="px-4 py-3 text-left font-medium text-gray-500">Descrição</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Categoria</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Vencimento</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Pago</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Ações</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <>
              <tr
                key={r.id}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <td className="px-4 py-3 text-gray-400">
                  {expandedId === r.id
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{r.description}</td>
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
                <td className="px-4 py-3 text-gray-500">
                  {formatCurrencyBRL(paidTotal(r))}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[effectiveStatus(r)]}>
                    {FINANCE_STATUS_EXTENDED_LABELS[effectiveStatus(r)]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Tooltip content="Pagamentos">
                      <button
                        onClick={() => onOpenPayments(r)}
                        className="text-primary hover:text-primary/80"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Remover lançamento">
                      <button
                        onClick={() => onDelete(r.id, r.description)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>

              {expandedId === r.id && (
                <tr key={`${r.id}-payments`} className="bg-muted/10">
                  <td colSpan={9} className="px-8 py-3">
                    {(r.payments ?? []).length === 0 ? (
                      <p className="text-xs text-gray-400 py-1">Nenhum pagamento registrado</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 mb-2">Pagamentos registrados</p>
                        {(r.payments ?? []).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-xs text-gray-600 bg-white rounded px-3 py-2 border border-border/40">
                            <span className="font-medium">{formatCurrencyBRL(Number(p.amount))}</span>
                            <span className="text-gray-400">{PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method}</span>
                            <span className="text-gray-400">{formatDateBR(p.paidAt)}</span>
                            {p.notes && <span className="text-gray-400 italic truncate max-w-[160px]">{p.notes}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
