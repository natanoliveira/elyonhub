import { formatCurrencyBRL } from '@elyonhub/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  income: number
  expense: number
  balance: number
}

export function FinanceSummary({ income, expense, balance }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
        <div className="rounded-full bg-green-100 p-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Receitas</p>
          <p className="text-lg font-bold text-green-600">{formatCurrencyBRL(income)}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
        <div className="rounded-full bg-red-100 p-2">
          <TrendingDown className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Despesas</p>
          <p className="text-lg font-bold text-red-500">{formatCurrencyBRL(expense)}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
        <div className={cn('rounded-full p-2', balance >= 0 ? 'bg-blue-100' : 'bg-orange-100')}>
          <DollarSign className={cn('h-5 w-5', balance >= 0 ? 'text-blue-600' : 'text-orange-500')} />
        </div>
        <div>
          <p className="text-xs text-gray-500">Saldo</p>
          <p className={cn('text-lg font-bold', balance >= 0 ? 'text-blue-600' : 'text-orange-500')}>
            {formatCurrencyBRL(balance)}
          </p>
        </div>
      </div>
    </div>
  )
}
