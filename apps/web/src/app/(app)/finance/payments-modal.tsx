'use client'

import { useTransition, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { formatCurrencyBRL, formatDateBR } from '@elyonhub/utils'
import {
  FinanceStatusExtended,
  PaymentMethod,
  FINANCE_STATUS_EXTENDED_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@elyonhub/types'
import { Trash2, Plus } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { effectiveStatus } from './finance-utils'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<FinanceStatusExtended, 'success' | 'warning' | 'secondary'> = {
  PAID: 'success',
  PARTIAL: 'warning',
  PENDING: 'secondary',
}

function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
}

const emptyForm = {
  amount: '',
  method: 'PIX' as PaymentMethod,
  paidAt: new Date().toISOString().slice(0, 10),
  notes: '',
}

interface Props {
  record: any | null
  open: boolean
  onClose: () => void
  onAdd: (financeId: string, data: { amount: number; method: PaymentMethod; paidAt?: string; notes?: string }) => void
  onRemove: (financeId: string, paymentId: string) => void
}

export function PaymentsModal({ record, open, onClose, onAdd, onRemove }: Props) {
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  if (!record) return null

  const payments: any[] = record.payments ?? []
  const paidTotal = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const remaining = Math.max(0, Number(record.amount) - paidTotal)

  function handleClose() {
    setForm(emptyForm)
    setShowForm(false)
    onClose()
  }

  function handleAdd() {
    startTransition(async () => {
      onAdd(record.id, {
        amount: parseCurrency(form.amount),
        method: form.method,
        paidAt: form.paidAt || undefined,
        notes: form.notes || undefined,
      })
      setForm(emptyForm)
      setShowForm(false)
    })
  }

  async function handleRemove(payment: any) {
    const ok = await confirm({
      title: 'Remover pagamento',
      description: `Remover pagamento de ${formatCurrencyBRL(Number(payment.amount))}?`,
      confirmLabel: 'Remover',
      variant: 'destructive',
    })
    if (!ok) return
    startTransition(async () => {
      onRemove(record.id, payment.id)
    })
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Pagamentos"
      description={record.description}
      className="max-w-lg"
    >
      {/* Resumo financeiro */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
          <p className="text-[11px] text-gray-500 mb-0.5">Total</p>
          <p className="text-sm font-bold text-foreground">{formatCurrencyBRL(Number(record.amount))}</p>
        </div>
        <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
          <p className="text-[11px] text-gray-500 mb-0.5">Pago</p>
          <p className="text-sm font-bold text-green-600">{formatCurrencyBRL(paidTotal)}</p>
        </div>
        <div className={cn('rounded-lg px-3 py-2 text-center', remaining > 0 ? 'bg-orange-50' : 'bg-green-50')}>
          <p className="text-[11px] text-gray-500 mb-0.5">Restante</p>
          <p className={cn('text-sm font-bold', remaining > 0 ? 'text-orange-500' : 'text-green-600')}>
            {formatCurrencyBRL(remaining)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Histórico</span>
          <Badge variant={STATUS_VARIANT[effectiveStatus(record)]}>
            {FINANCE_STATUS_EXTENDED_LABELS[effectiveStatus(record)]}
          </Badge>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Novo pagamento
          </button>
        )}
      </div>

      {/* Lista de pagamentos */}
      <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Nenhum pagamento registrado</p>
        ) : (
          payments.map((p: any) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-white px-3 py-2.5 text-sm"
            >
              <Tooltip content="Remover pagamento">
                <button
                  onClick={() => handleRemove(p)}
                  className="ml-auto text-gray-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
              <span className="font-semibold text-foreground w-24 shrink-0">
                {formatCurrencyBRL(Number(p.amount))}
              </span>
              <span className="text-gray-400 shrink-0">{formatDateBR(p.paidAt)}</span>
              <span className="text-gray-500 shrink-0">
                {PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method}
              </span>
              {p.notes && (
                <span className="text-gray-400 italic truncate flex-1">{p.notes}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulário de novo pagamento */}
      {showForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Novo pagamento</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Valor (R$) *</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: maskCurrency(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Data *</label>
              <Input
                type="date"
                value={form.paidAt}
                onChange={(e) => setForm((f) => ({ ...f, paidAt: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Forma de pagamento *</label>
            <select
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
              className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Observações</label>
            <Input
              placeholder="Opcional..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setForm(emptyForm); setShowForm(false) }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!form.amount || isPending}>
              Registrar
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={handleClose}>Fechar</Button>
      </div>
    </Dialog>
  )
}
