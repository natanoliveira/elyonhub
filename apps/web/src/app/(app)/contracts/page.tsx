'use client'

import { useTransition, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsService } from '@/services/contracts.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { formatCurrencyBRL, formatDateBR, formatPhoneBR } from '@elyonhub/utils'
import {
  ContractStatus,
  PaymentType,
  CONTRACT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
} from '@elyonhub/types'
import { Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm = {
  clientName: '',
  phone: '',
  email: '',
  document: '',
  contractValue: '',
  paymentType: 'CASH' as PaymentType,
  startDate: '',
  notes: '',
}

const STATUS_VARIANT: Record<ContractStatus, 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  PENDING: 'secondary',
  CANCELED: 'destructive',
}

export default function ContractsPage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [filterStatus, setFilterStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', filterStatus],
    queryFn: () => contractsService.list({ status: filterStatus || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: contractsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      setDialogOpen(false)
      setForm(emptyForm)
      toast.success('Contrato criado com sucesso!')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Erro ao criar contrato'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContractStatus }) =>
      contractsService.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('Status atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  async function handleCreate() {
    const ok = await confirm({
      title: 'Criar contrato',
      description: `Deseja criar o contrato para "${form.clientName}"?`,
      confirmLabel: 'Criar',
    })
    if (!ok) return
    startTransition(async () => {
      createMutation.mutate({ ...form, contractValue: Number(form.contractValue) })
    })
  }

  async function handleCancel(id: string, clientName: string) {
    const ok = await confirm({
      title: 'Cancelar contrato',
      description: `Deseja cancelar o contrato de "${clientName}"?`,
      confirmLabel: 'Cancelar contrato',
      variant: 'destructive',
    })
    if (!ok) return
    startTransition(async () => { updateStatusMutation.mutate({ id, status: ContractStatus.CANCELED }) })
  }

  const list: any[] = Array.isArray(contracts) ? contracts : []

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Novo Contrato
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground"
        >
          <option value="">Todos os status</option>
          {Object.entries(CONTRACT_STATUS_LABELS).map(([k, v]) => (
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
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Pagamento</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Início</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Valor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      Nenhum contrato encontrado
                    </td>
                  </tr>
                ) : (
                  list.map((c: any) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{c.clientName}</p>
                        {c.document && <p className="text-xs text-gray-400">{c.document}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatPhoneBR(c.phone)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {PAYMENT_TYPE_LABELS[c.paymentType as PaymentType]}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDateBR(c.startDate)}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {formatCurrencyBRL(Number(c.contractValue))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[c.status as ContractStatus]}>
                          {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.status !== 'CANCELED' && (
                          <button
                            onClick={() => handleCancel(c.id, c.clientName)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {list.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Nenhum contrato encontrado</p>
            ) : (
              list.map((c: any) => (
                <div key={c.id} className="rounded-lg border bg-white p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{c.clientName}</p>
                      {c.document && <p className="text-xs text-gray-400">{c.document}</p>}
                    </div>
                    <Badge variant={STATUS_VARIANT[c.status as ContractStatus]}>
                      {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrencyBRL(Number(c.contractValue))}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {PAYMENT_TYPE_LABELS[c.paymentType as PaymentType]}
                    </span>
                  </p>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{formatPhoneBR(c.phone)}</span>
                    <span>Início: {formatDateBR(c.startDate)}</span>
                  </div>
                  {c.notes && <p className="text-xs text-gray-500 italic">{c.notes}</p>}
                  {c.status !== 'CANCELED' && (
                    <button
                      onClick={() => handleCancel(c.id, c.clientName)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Cancelar contrato
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Novo Contrato">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome do cliente *</label>
            <Input
              placeholder="Nome completo"
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone *</label>
              <Input
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">CPF / CNPJ</label>
              <Input
                placeholder="000.000.000-00"
                value={form.document}
                onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">E-mail</label>
            <Input
              type="email"
              placeholder="cliente@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Valor (R$) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.contractValue}
                onChange={(e) => setForm((f) => ({ ...f, contractValue: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Forma de Pagamento *</label>
              <select
                value={form.paymentType}
                onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value as PaymentType }))}
                className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm"
              >
                {Object.entries(PAYMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Data de Início *</label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Observações</label>
            <Input
              placeholder="Notas adicionais..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.clientName || !form.phone || !form.contractValue || !form.startDate || isPending}
            >
              Criar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
