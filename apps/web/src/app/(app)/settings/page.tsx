'use client'

import { useTransition, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

export default function SettingsPage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [tab, setTab] = useState<'company' | 'whatsapp'>('company')
  const [isPending, startTransition] = useTransition()

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await api.get('/companies/me')
      return res.data.data
    },
  })

  const [form, setForm] = useState({ name: '', logoUrl: '', followUpDays: 3 })
  const [wpForm, setWpForm] = useState({ instanceId: '', apiKey: '' })

  useState(() => {
    if (company) {
      setForm({ name: company.name, logoUrl: company.logoUrl ?? '', followUpDays: company.followUpDays })
      const wp = company.whatsappConfig as any
      if (wp) setWpForm({ instanceId: wp.instanceId ?? '', apiKey: wp.apiKey ?? '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/companies/me', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company'] }); toast.success('Salvo!') },
    onError: () => toast.error('Erro ao salvar'),
  })

  const updateWpMutation = useMutation({
    mutationFn: (data: any) => api.patch('/companies/me/whatsapp', data).then((r) => r.data.data),
    onSuccess: () => toast.success('WhatsApp configurado!'),
    onError: () => toast.error('Erro ao salvar'),
  })

  async function handleSaveCompany() {
    const ok = await confirm({
      title: 'Salvar configurações',
      description: 'Deseja salvar as alterações da empresa?',
      confirmLabel: 'Salvar',
    })
    if (!ok) return
    startTransition(async () => { updateMutation.mutate(form) })
  }

  async function handleSaveWhatsApp() {
    const ok = await confirm({
      title: 'Salvar integração WhatsApp',
      description: 'Deseja salvar as configurações da integração WhatsApp?',
      confirmLabel: 'Salvar',
    })
    if (!ok) return
    startTransition(async () => { updateWpMutation.mutate(wpForm) })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <div className="flex gap-2 border-b border-border">
        {(['company', 'whatsapp'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'}`}
          >
            {t === 'company' ? 'Empresa' : 'WhatsApp'}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <Card className="max-w-lg space-y-4">
          <Input label="Nome da empresa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="URL do logotipo" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
          <Input
            label="Dias para follow-up"
            type="number"
            value={form.followUpDays}
            onChange={(e) => setForm({ ...form, followUpDays: parseInt(e.target.value) || 3 })}
          />
          <Button loading={isPending || updateMutation.isPending} onClick={handleSaveCompany}>
            Salvar alterações
          </Button>
        </Card>
      )}

      {tab === 'whatsapp' && (
        <Card className="max-w-lg space-y-4">
          <Input label="Instance ID (Evolution API)" value={wpForm.instanceId} onChange={(e) => setWpForm({ ...wpForm, instanceId: e.target.value })} />
          <Input label="API Key" type="password" value={wpForm.apiKey} onChange={(e) => setWpForm({ ...wpForm, apiKey: e.target.value })} />
          <Button loading={isPending || updateWpMutation.isPending} onClick={handleSaveWhatsApp}>
            Salvar integração
          </Button>
        </Card>
      )}
    </div>
  )
}
