'use client'

import { useTransition, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { usersService, UserDto } from '@/services/users.service'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'

type Tab = 'company' | 'users' | 'whatsapp'

const ROLE_LABELS = { ADMIN: 'Administrador', SELLER: 'Vendedor' } as const

export default function SettingsPage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [tab, setTab] = useState<Tab>('company')
  const [isPending, startTransition] = useTransition()

  // ─── Company tab state ───────────────────────────────────────────────────
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
    const ok = await confirm({ title: 'Salvar configurações', description: 'Deseja salvar as alterações da empresa?', confirmLabel: 'Salvar' })
    if (!ok) return
    startTransition(async () => { updateMutation.mutate(form) })
  }

  async function handleSaveWhatsApp() {
    const ok = await confirm({ title: 'Salvar integração WhatsApp', description: 'Deseja salvar as configurações da integração WhatsApp?', confirmLabel: 'Salvar' })
    if (!ok) return
    startTransition(async () => { updateWpMutation.mutate(wpForm) })
  }

  // ─── Users tab state ─────────────────────────────────────────────────────
  const { data: users = [], isLoading: loadingUsers } = useQuery<UserDto[]>({
    queryKey: ['users'],
    queryFn: usersService.list,
    enabled: tab === 'users',
  })

  const [userDialog, setUserDialog] = useState<{ open: boolean; editing: UserDto | null }>({ open: false, editing: null })
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'SELLER' as 'ADMIN' | 'SELLER' })

  function openCreate() {
    setUserForm({ name: '', email: '', password: '', role: 'SELLER' })
    setUserDialog({ open: true, editing: null })
  }

  function openEdit(u: UserDto) {
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role })
    setUserDialog({ open: true, editing: u })
  }

  const createUserMutation = useMutation({
    mutationFn: () => usersService.create({ name: userForm.name, email: userForm.email, password: userForm.password, role: userForm.role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setUserDialog({ open: false, editing: null }); toast.success('Usuário criado!') },
    onError: (e: any) => toast.error(e.response?.data?.error?.message ?? 'Erro ao criar usuário'),
  })

  const updateUserMutation = useMutation({
    mutationFn: (id: string) => usersService.update(id, { name: userForm.name, role: userForm.role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setUserDialog({ open: false, editing: null }); toast.success('Usuário atualizado!') },
    onError: (e: any) => toast.error(e.response?.data?.error?.message ?? 'Erro ao atualizar'),
  })

  async function handleSaveUser() {
    const isEdit = !!userDialog.editing
    const ok = await confirm({
      title: isEdit ? 'Atualizar usuário' : 'Criar usuário',
      description: isEdit
        ? `Deseja atualizar os dados de "${userDialog.editing!.name}"?`
        : `Deseja criar o usuário "${userForm.name}"?`,
      confirmLabel: isEdit ? 'Atualizar' : 'Criar',
    })
    if (!ok) return
    startTransition(async () => {
      if (isEdit) updateUserMutation.mutate(userDialog.editing!.id)
      else createUserMutation.mutate()
    })
  }

  async function handleDeactivate(u: UserDto) {
    const ok = await confirm({
      title: 'Desativar usuário',
      description: `Deseja desativar "${u.name}"? O usuário não conseguirá mais fazer login.`,
      confirmLabel: 'Desativar',
      variant: 'destructive',
    })
    if (!ok) return
    startTransition(async () => {
      try {
        await usersService.deactivate(u.id)
        qc.invalidateQueries({ queryKey: ['users'] })
        toast.success('Usuário desativado')
      } catch (e: any) {
        toast.error(e.response?.data?.error?.message ?? 'Erro ao desativar')
      }
    })
  }

  async function handleReactivate(u: UserDto) {
    const ok = await confirm({
      title: 'Reativar usuário',
      description: `Deseja reativar "${u.name}"?`,
      confirmLabel: 'Reativar',
    })
    if (!ok) return
    startTransition(async () => {
      try {
        await usersService.reactivate(u.id)
        qc.invalidateQueries({ queryKey: ['users'] })
        toast.success('Usuário reativado')
      } catch {
        toast.error('Erro ao reativar')
      }
    })
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'company', label: 'Empresa' },
    { key: 'users', label: 'Usuários' },
    { key: 'whatsapp', label: 'WhatsApp' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Empresa ── */}
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

      {/* ── Usuários ── */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Novo Usuário
            </Button>
          </div>

          {loadingUsers ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Nenhum usuário encontrado</p>
          ) : (
            <>
              {/* ── Desktop: tabela ── */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Papel</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge label={ROLE_LABELS[u.role]} stage={u.role === 'ADMIN' ? 'PROPOSAL' : 'CONTACT'} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {u.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(u)} className="rounded p-1 text-gray-400 hover:text-primary transition-colors" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </button>
                            {u.active
                              ? <button onClick={() => handleDeactivate(u)} className="text-xs text-red-500 hover:underline">Desativar</button>
                              : <button onClick={() => handleReactivate(u)} className="text-xs text-green-600 hover:underline">Reativar</button>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile: cards ── */}
              <div className="flex flex-col gap-3 md:hidden">
                {users.map((u) => (
                  <div key={u.id} className="rounded-lg border border-border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge label={ROLE_LABELS[u.role]} stage={u.role === 'ADMIN' ? 'PROPOSAL' : 'CONTACT'} />
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(u)} className="text-xs text-primary hover:underline">Editar</button>
                        {u.active
                          ? <button onClick={() => handleDeactivate(u)} className="text-xs text-red-500 hover:underline">Desativar</button>
                          : <button onClick={() => handleReactivate(u)} className="text-xs text-green-600 hover:underline">Reativar</button>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── WhatsApp ── */}
      {tab === 'whatsapp' && (
        <Card className="max-w-lg space-y-4">
          <Input label="Instance ID (Evolution API)" value={wpForm.instanceId} onChange={(e) => setWpForm({ ...wpForm, instanceId: e.target.value })} />
          <Input label="API Key" type="password" value={wpForm.apiKey} onChange={(e) => setWpForm({ ...wpForm, apiKey: e.target.value })} />
          <Button loading={isPending || updateWpMutation.isPending} onClick={handleSaveWhatsApp}>
            Salvar integração
          </Button>
        </Card>
      )}

      {/* ── Dialog Criar / Editar Usuário ── */}
      <Dialog
        open={userDialog.open}
        onClose={() => setUserDialog({ open: false, editing: null })}
        title={userDialog.editing ? 'Editar Usuário' : 'Novo Usuário'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setUserDialog({ open: false, editing: null })}>Cancelar</Button>
            <Button loading={isPending || createUserMutation.isPending || updateUserMutation.isPending} onClick={handleSaveUser}>
              {userDialog.editing ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nome *"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            placeholder="Nome completo"
          />
          {!userDialog.editing && (
            <>
              <Input
                label="Email *"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="usuario@suaempresa.com"
              />
              <Input
                label="Senha *"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Papel *</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'ADMIN' | 'SELLER' })}
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground"
            >
              <option value="SELLER">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
