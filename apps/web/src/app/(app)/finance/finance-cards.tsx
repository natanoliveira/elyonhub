import { Badge } from '@/components/ui/badge'
import { formatCurrencyBRL, formatDateBR } from '@elyonhub/utils'
import {
  FinanceType,
  FinanceStatusExtended,
  FINANCE_TYPE_LABELS,
  FINANCE_STATUS_EXTENDED_LABELS,
} from '@elyonhub/types'
import { CreditCard, Trash2 } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { paidTotal, effectiveStatus } from './finance-utils'
import { cn } from '@/lib/utils'

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

export function FinanceCards({ records, onOpenPayments, onDelete }: Props) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col gap-3 md:hidden">
        <p className="py-10 text-center text-sm text-gray-400">Nenhum lançamento encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {records.map((r) => (
        <div key={r.id} className="rounded-lg border bg-white p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground">{r.description}</p>
            <span className={cn('text-sm font-bold', r.type === 'INCOME' ? 'text-green-600' : 'text-red-500')}>
              {formatCurrencyBRL(Number(r.amount))}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={r.type === 'INCOME' ? 'success' : 'destructive'}>
              {FINANCE_TYPE_LABELS[r.type as FinanceType]}
            </Badge>
            <Badge variant={STATUS_VARIANT[effectiveStatus(r)]}>
              {FINANCE_STATUS_EXTENDED_LABELS[effectiveStatus(r)]}
            </Badge>
            {r.category && <span className="text-xs text-gray-400">{r.category}</span>}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Vencimento: {formatDateBR(r.dueDate)}</span>
            <span>Pago: {formatCurrencyBRL(paidTotal(r))}</span>
          </div>

          <div className="flex gap-3 pt-1">
            <Tooltip content="Ver e registrar pagamentos" side="top">
              <button
                onClick={() => onOpenPayments(r)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <CreditCard className="h-3.5 w-3.5" /> Pagamentos
              </button>
            </Tooltip>
            <Tooltip content="Remover lançamento" side="top">
              <button
                onClick={() => onDelete(r.id, r.description)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  )
}
