'use client'

import { useTransition, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsService } from '@/services/leads.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { formatPhoneBR, formatDateBR, isOverdue } from '@elyonhub/utils'
import { PIPELINE_STAGE_LABELS } from '@elyonhub/types'
import { Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LeadsPage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['leads', search, stage],
    queryFn: () => leadsService.list({ search: search || undefined, stage: stage || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: leadsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      setDialogOpen(false)
      setForm({ name: '', phone: '', email: '' })
      toast.success('Lead criado com sucesso!')
    },
    onError: () => toast.error('Erro ao criar lead'),
  })

  async function handleCreate() {
    const ok = await confirm({
      title: 'Criar lead',
      description: `Deseja criar o lead "${form.name}"?`,
      confirmLabel: 'Criar',
    })
    if (!ok) return
    startTransition(async () => { createMutation.mutate(form) })
  }

  const leads = data?.data ?? []

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Novo Lead
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground"
        >
          <option value="">Todas as etapas</option>
          {Object.entries(PIPELINE_STAGE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">Nenhum lead encontrado</p>
          <p className="text-sm">Crie um novo lead ou ajuste os filtros</p>
        </div>
      ) : (
        <>
          {/* ── Desktop: tabela ── */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Etapa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Vendedor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Último contato</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary">
                        {isOverdue(lead.lastContact, 3) && (
                          <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />
                        )}
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatPhoneBR(lead.phone)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={PIPELINE_STAGE_LABELS[lead.pipelineStage as keyof typeof PIPELINE_STAGE_LABELS]}
                        stage={lead.pipelineStage}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.assignedUser?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {lead.lastContact ? formatDateBR(lead.lastContact) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {leads.map((lead: any) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isOverdue(lead.lastContact, 3) && (
                      <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />
                    )}
                    <p className="font-semibold text-foreground truncate">{lead.name}</p>
                  </div>
                  <Badge
                    label={PIPELINE_STAGE_LABELS[lead.pipelineStage as keyof typeof PIPELINE_STAGE_LABELS]}
                    stage={lead.pipelineStage}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatPhoneBR(lead.phone)}</span>
                  <span>{lead.assignedUser?.name ?? '—'}</span>
                </div>
                {lead.lastContact && (
                  <p className="text-xs text-gray-400">Último contato: {formatDateBR(lead.lastContact)}</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Novo Lead"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button loading={isPending || createMutation.isPending} onClick={handleCreate}>
              Criar Lead
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do lead" />
          <Input label="Telefone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="opcional" />
        </div>
      </Dialog>
    </div>
  )
}
