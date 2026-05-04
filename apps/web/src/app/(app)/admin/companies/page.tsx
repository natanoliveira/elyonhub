'use client'

import { useTransition, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { formatDateBR } from '@elyonhub/utils'
import { toast } from 'sonner'
import { Building2, Users, BarChart2, Power, Settings2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-600',
  pro:     'bg-violet-100 text-violet-700',
  scale:   'bg-amber-100 text-amber-700',
}

export default function AdminCompaniesPage() {
  const { isMaster } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()

  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [newPlanId, setNewPlanId] = useState('')

  useEffect(() => { if (!isMaster()) router.replace('/dashboard') }, [])

  const { data: companies, isLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => api.get('/admin/companies').then((r) => r.data.data),
    enabled: isMaster(),
  })

  const { data: plansData } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api.get('/admin/plans').then((r) => r.data.data),
    enabled: isMaster(),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/companies/${id}/toggle`).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-companies'] }); toast.success('Status atualizado!') },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  const planMutation = useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) =>
      api.patch(`/admin/companies/${id}/plan`, { planId }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-companies'] })
      setPlanDialogOpen(false)
      toast.success('Plano atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar plano'),
  })

  async function handleToggle(company: any) {
    const action = company.active ? 'suspender' : 'reativar'
    const ok = await confirm({
      title: `${company.active ? 'Suspender' : 'Reativar'} empresa`,
      description: `Deseja ${action} "${company.name}"?`,
      confirmLabel: company.active ? 'Suspender' : 'Reativar',
      variant: company.active ? 'destructive' : 'default',
    })
    if (!ok) return
    startTransition(async () => { toggleMutation.mutate(company.id) })
  }

  function openPlanDialog(company: any) {
    setSelectedCompany(company)
    setNewPlanId(company.plan.id)
    setPlanDialogOpen(true)
  }

  function handleChangePlan() {
    if (!selectedCompany) return
    startTransition(async () => {
      planMutation.mutate({ id: selectedCompany.id, planId: newPlanId })
    })
  }

  if (!isMaster()) return null

  const total = companies?.length ?? 0
  const active = companies?.filter((c: any) => c.active).length ?? 0

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-sm text-gray-500">Gerencie clientes, planos e status de acesso</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de empresas', value: total, icon: Building2, color: 'text-primary' },
          { label: 'Ativas', value: active, icon: Power, color: 'text-green-600' },
          { label: 'Suspensas', value: total - active, icon: Power, color: 'text-red-500' },
          { label: 'Planos pro/scale', value: companies?.filter((c: any) => c.plan?.name !== 'starter').length ?? 0, icon: BarChart2, color: 'text-violet-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3 shadow-sm">
            <s.icon className={cn('h-5 w-5', s.color)} />
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-xl border bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Admin</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Plano</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Uso</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Desde</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(companies ?? []).map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.emailDomain}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{c.adminName ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.adminEmail ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', PLAN_COLORS[c.plan?.name] ?? 'bg-gray-100 text-gray-600')}>
                        {c.plan?.name}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">R$ {Number(c.plan?.price).toFixed(0)}/mês</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {c.usersCount} usuários
                      </div>
                      <div className="text-xs text-gray-400">{c.leadsCount} leads · {c.contractsCount} contratos</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateBR(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.active ? 'success' : 'destructive'}>
                        {c.active ? 'Ativa' : 'Suspensa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openPlanDialog(c)}
                          className="text-gray-400 hover:text-primary"
                          title="Alterar plano"
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(c)}
                          className={cn('', c.active ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-600')}
                          title={c.active ? 'Suspender' : 'Reativar'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {(companies ?? []).map((c: any) => (
              <div key={c.id} className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.emailDomain}</p>
                  </div>
                  <Badge variant={c.active ? 'success' : 'destructive'}>
                    {c.active ? 'Ativa' : 'Suspensa'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 font-medium capitalize', PLAN_COLORS[c.plan?.name] ?? 'bg-gray-100 text-gray-600')}>
                    {c.plan?.name}
                  </span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.usersCount} usuários</span>
                  <span>{c.leadsCount} leads</span>
                </div>
                {c.adminEmail && (
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Mail className="h-3 w-3" />{c.adminEmail}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openPlanDialog(c)}>
                    <Settings2 className="h-3.5 w-3.5 mr-1" /> Alterar plano
                  </Button>
                  <Button
                    size="sm"
                    variant={c.active ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => handleToggle(c)}
                  >
                    <Power className="h-3.5 w-3.5 mr-1" /> {c.active ? 'Suspender' : 'Reativar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Plan change dialog */}
      <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} title={`Alterar plano — ${selectedCompany?.name}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            {(plansData ?? []).map((p: any) => (
              <label key={p.id} className={cn(
                'flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors',
                newPlanId === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              )}>
                <input
                  type="radio"
                  name="newPlan"
                  value={p.id}
                  checked={newPlanId === p.id}
                  onChange={() => setNewPlanId(p.id)}
                  className="accent-primary"
                />
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium capitalize">{p.name}</span>
                  <span className="text-sm text-gray-500">R$ {Number(p.price).toFixed(0)}/mês</span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangePlan} disabled={isPending || newPlanId === selectedCompany?.plan?.id}>
              Salvar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
