'use client'

import { useTransition, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeService } from '@/services/finance.service'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { FinanceType } from '@elyonhub/types'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { FinanceSummary } from './finance-summary'
import { FinanceFilters } from './finance-filters'
import { FinanceTable } from './finance-table'
import { FinanceCards } from './finance-cards'
import { FinanceCreateDialog, CreateFinanceForm } from './finance-create-dialog'
import { PaymentsModal } from './payments-modal'

const emptyForm: CreateFinanceForm = {
  type: 'INCOME' as FinanceType,
  description: '',
  amount: '',
  dueDate: '',
  category: '',
}

export default function FinancePage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<CreateFinanceForm>(emptyForm)
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)

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
  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null

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

  function openPaymentsModal(record: any) {
    setSelectedRecordId(record.id)
    setPaymentsModalOpen(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      <FinanceSummary
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
      />

      <FinanceFilters
        filterType={filterType}
        filterStatus={filterStatus}
        onTypeChange={setFilterType}
        onStatusChange={setFilterStatus}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <FinanceTable
            records={records}
            onOpenPayments={openPaymentsModal}
            onDelete={handleDelete}
          />
          <FinanceCards
            records={records}
            onOpenPayments={openPaymentsModal}
            onDelete={handleDelete}
          />
        </>
      )}

      <FinanceCreateDialog
        open={dialogOpen}
        form={form}
        isPending={isPending}
        onChange={setForm}
        onSubmit={handleCreate}
        onClose={() => setDialogOpen(false)}
      />

      <PaymentsModal
        record={selectedRecord}
        open={paymentsModalOpen}
        onClose={() => { setPaymentsModalOpen(false); setSelectedRecordId(null) }}
        onAdd={(financeId, data) => addPaymentMutation.mutate({ financeId, data })}
        onRemove={(financeId, paymentId) => removePaymentMutation.mutate({ financeId, paymentId })}
      />
    </div>
  )
}
