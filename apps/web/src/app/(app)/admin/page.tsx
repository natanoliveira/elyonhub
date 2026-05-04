'use client'

import { useTransition, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const ALL_MENUS = [
  { key: 'dashboard',  label: 'Dashboard' },
  { key: 'pipeline',   label: 'Pipeline' },
  { key: 'inbox',      label: 'Inbox' },
  { key: 'leads',      label: 'Leads' },
  { key: 'follow-up',  label: 'Follow-up' },
  { key: 'finance',    label: 'Financeiro' },
  { key: 'contracts',  label: 'Contratos' },
  { key: 'reports',    label: 'Relatórios' },
  { key: 'settings',   label: 'Configurações' },
]

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', scale: 'Scale / Premium',
}

export default function AdminPage() {
  const { isMaster } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isMaster()) router.replace('/dashboard')
  }, [])

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api.get('/admin/plans').then((r) => r.data.data),
    enabled: isMaster(),
  })

  const [localMenus, setLocalMenus] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (plans) {
      const init: Record<string, string[]> = {}
      for (const p of plans) init[p.id] = Array.isArray(p.allowedMenus) ? p.allowedMenus : []
      setLocalMenus(init)
    }
  }, [plans])

  const saveMutation = useMutation({
    mutationFn: ({ id, menus }: { id: string; menus: string[] }) =>
      api.patch(`/admin/plans/${id}/menus`, { allowedMenus: menus }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] })
      toast.success('Menus atualizados!')
    },
    onError: () => toast.error('Erro ao salvar'),
  })

  function toggleMenu(planId: string, key: string) {
    setLocalMenus((prev) => {
      const current = prev[planId] ?? []
      return {
        ...prev,
        [planId]: current.includes(key)
          ? current.filter((k) => k !== key)
          : [...current, key],
      }
    })
  }

  function handleSave(planId: string) {
    startTransition(async () => {
      saveMutation.mutate({ id: planId, menus: localMenus[planId] ?? [] })
    })
  }

  if (!isMaster()) return null

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administração Master</h1>
          <p className="text-sm text-gray-500">Configure quais menus cada plano de assinatura pode acessar</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(plans ?? []).map((plan: any) => (
            <div key={plan.id} className="rounded-xl border border-border bg-white p-5 space-y-4 shadow-sm">
              <div>
                <p className="font-bold text-foreground text-lg">
                  {PLAN_NAMES[plan.name] ?? plan.name}
                </p>
                <p className="text-xs text-gray-400">R$ {Number(plan.price).toFixed(2)}/mês</p>
              </div>

              <div className="space-y-2">
                {ALL_MENUS.map(({ key, label }) => {
                  const checked = (localMenus[plan.id] ?? []).includes(key)
                  return (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMenu(plan.id, key)}
                        className="h-4 w-4 rounded border-border text-primary accent-primary"
                      />
                      <span className={`text-sm ${checked ? 'text-foreground font-medium' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </label>
                  )
                })}
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => handleSave(plan.id)}
                loading={isPending && saveMutation.variables?.id === plan.id}
              >
                Salvar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
