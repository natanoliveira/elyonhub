'use client'

import { useTransition, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeService } from '@/services/finance.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { formatCurrencyBRL, formatDateBR } from '@elyonhub/utils'
import {
  FinanceType,
  FinanceStatusExtended,
  PaymentMethod,
  FINANCE_TYPE_LABELS,
  FINANCE_STATUS_EXTENDED_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@elyonhub/types'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  ChevronDown,
  ChevronRight,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const emptyForm = {
  type: 'INCOME' as FinanceType,
  description: '',
  amount: '',
  dueDate: '',
  category: '',
}

const emptyPaymentForm = {
  amount: '',
  method: 'PIX' as PaymentMethod,
  paidAt: new Date().toISOString().slice(0, 10),
  notes: '',
}

const STATUS_VARIANT: Record<FinanceStatusExtended, 'success' | 'warning' | 'secondary'> = {
  PAID: 'success',
  PARTIAL: 'warning',
  PENDING: 'secondary',
}

export default function FinancePage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['finance', filterType, filterStatus],
    queryFn: () =>
      financeService.list({
        type: filterType || undefined,
        status: filterStatus || undefined,
      }),
  })

  const records: any[] = data?.data ?? []
  const summary = data?.summary ?? { income: 0, expense: 0, balance: 0 }

  const createMutation = useMutation({
    mutationFn: financeService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      setDialogOpen(false)
      setForm(emptyForm)
      toast.success('Lançamento criado com sucesso!')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Erro ao criar lançamento'),
  })

  const addPaymentMutation = useMutation({
    mutationFn: ({ financeId, data }: { financeId: string; data: any }) =>
      financeService.addPayment(financeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      setPaymentDialogOpen(false)
      setPaymentForm(emptyPaymentForm)
      toast.success('Pagamento registrado!')
    },
    onError: () => toast.error('Erro ao registrar pagamento'),
  })

  const removePaymentMutation = useMutation({
    mutationFn: ({ financeId, paymentId }: { financeId: string; paymentId: string }) =>
      financeService.removePayment(financeId, paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Pagamento removido!')
    },
    onError: () => toast.error('Erro ao remover pagamento'),
  })

  const deleteMutation = useMutation({
    mutationFn: financeService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Lançamento removido!')
    },
    onError: () => toast.error('Erro ao remover'),
  })

  async function handleCreate() {
    const ok = await confirm({
      title: 'Criar lançamento',
      description: `Deseja criar o lançamento "${form.description}"?`,
      confirmLabel: 'Criar',
    })
    if (!ok) return
    startTransition(async () => {
      createMutation.mutate({ ...form, amount: Number(form.amount) })
    })
  }

  function openPaymentDialog(record: any) {
    setSelectedRecord(record)
    setPaymentForm({ ...emptyPaymentForm, amount: '' })
    setPaymentDialogOpen(true)
  }

  async function handleAddPayment() {
    if (!selectedRecord) return
    startTransition(async () => {
      addPaymentMutation.mutate({
        financeId: selectedRecord.id,
        data: {
          amount: Number(paymentForm.amount),
          method: paymentForm.method,
          paidAt: paymentForm.paidAt || undefined,
          notes: paymentForm.notes || undefined,
        },
      })
    })
  }

  async function handleRemovePayment(record: any, payment: any) {
    const ok = await confirm({
      title: 'Remover pagamento',
      description: `Remover pagamento de ${formatCurrencyBRL(Number(payment.amount))}?`,
      confirmLabel: 'Remover',
      variant: 'destructive',
    })
    if (!ok) return
    startTransition(async () => {
      removePaymentMutation.mutate({ financeId: record.id, paymentId: payment.id })
    })
  }

  async function handleDelete(id: string, description: string) {
    const ok = await confirm({
      title: 'Remover lançamento',
      description: `Deseja remover "${description}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Remover',
      variant: 'destructive',
    })
    if (!ok) return
    startTransition(async () => { deleteMutation.mutate(id) })
  }

  function paidTotal(record: any) {
    return (record.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Receitas</p>
            <p className="text-lg font-bold text-green-600">{formatCurrencyBRL(summary.income)}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Despesas</p>
            <p className="text-lg font-bold text-red-500">{formatCurrencyBRL(summary.expense)}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 flex items-center gap-3">
          <div className={cn('rounded-full p-2', summary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100')}>
            <DollarSign className={cn('h-5 w-5', summary.balance >= 0 ? 'text-blue-600' : 'text-orange-500')} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Saldo</p>
            <p className={cn('text-lg font-bold', summary.balance >= 0 ? 'text-blue-600' : 'text-orange-500')}>
              {formatCurrencyBRL(summary.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(FINANCE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground"
        >
          <option value="">Todos os status</option>
          {Object.entries(FINANCE_STATUS_EXTENDED_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : (
        <>
          {/* Desktop table */}
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
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                      Nenhum lançamento encontrado
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
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
                          <Badge variant={STATUS_VARIANT[r.status as FinanceStatusExtended] ?? 'secondary'}>
                            {FINANCE_STATUS_EXTENDED_LABELS[r.status as FinanceStatusExtended] ?? r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {r.status !== 'PAID' && (
                              <button
                                onClick={() => openPaymentDialog(r)}
                                className="text-primary hover:text-primary/80"
                                title="Registrar pagamento"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(r.id, r.description)}
                              className="text-gray-400 hover:text-red-500"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
                                    <button
                                      onClick={() => handleRemovePayment(r, p)}
                                      className="text-gray-300 hover:text-red-500 ml-2"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {records.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Nenhum lançamento encontrado</p>
            ) : (
              records.map((r) => (
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
                    <Badge variant={STATUS_VARIANT[r.status as FinanceStatusExtended] ?? 'secondary'}>
                      {FINANCE_STATUS_EXTENDED_LABELS[r.status as FinanceStatusExtended] ?? r.status}
                    </Badge>
                    {r.category && <span className="text-xs text-gray-400">{r.category}</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Vencimento: {formatDateBR(r.dueDate)}</span>
                    <span>Pago: {formatCurrencyBRL(paidTotal(r))}</span>
                  </div>

                  {/* Payments list */}
                  {(r.payments ?? []).length > 0 && (
                    <div className="pt-1 space-y-1">
                      <p className="text-xs font-medium text-gray-500">Pagamentos</p>
                      {(r.payments ?? []).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-xs text-gray-500 bg-muted/20 rounded px-2 py-1">
                          <span>{formatCurrencyBRL(Number(p.amount))}</span>
                          <span>{PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method}</span>
                          <span>{formatDateBR(p.paidAt)}</span>
                          <button onClick={() => handleRemovePayment(r, p)} className="text-gray-300 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    {r.status !== 'PAID' && (
                      <button
                        onClick={() => openPaymentDialog(r)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Registrar pagamento
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id, r.description)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Novo Lançamento">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FinanceType }))}
              className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm"
            >
              {Object.entries(FINANCE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descrição *</label>
            <Input
              placeholder="Ex: Assinatura de software"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valor (R$) *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Vencimento *</label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Categoria</label>
            <Input
              placeholder="Ex: Marketing, Infraestrutura..."
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.description || !form.amount || !form.dueDate || isPending}
            >
              Criar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Payment dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        title={`Registrar Pagamento — ${selectedRecord?.description ?? ''}`}
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold">{formatCurrencyBRL(Number(selectedRecord?.amount ?? 0))}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Já pago</span>
              <span className="font-semibold text-green-600">{formatCurrencyBRL(paidTotal(selectedRecord ?? {}))}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Restante</span>
              <span className="font-semibold text-primary">
                {formatCurrencyBRL(Math.max(0, Number(selectedRecord?.amount ?? 0) - paidTotal(selectedRecord ?? {})))}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Valor pago (R$) *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Forma de pagamento *</label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
              className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Data do pagamento</label>
            <Input
              type="date"
              value={paymentForm.paidAt}
              onChange={(e) => setPaymentForm((f) => ({ ...f, paidAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Observações</label>
            <Input
              placeholder="Opcional..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAddPayment}
              disabled={!paymentForm.amount || isPending}
            >
              Registrar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
