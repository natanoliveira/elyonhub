'use client'

import { useTransition, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

const ROLE_LABELS = { ADMIN: 'Administrador', SELLER: 'Vendedor' } as const

export default function ProfilePage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const { user, setAuth } = useAuthStore()
  const [isPending, startTransition] = useTransition()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getMe,
  })

  const [nameForm, setNameForm] = useState({ name: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    if (profile) setNameForm({ name: profile.name })
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: profileService.updateMe,
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      if (user) {
        const at = localStorage.getItem('accessToken') ?? ''
        const rt = localStorage.getItem('refreshToken') ?? ''
        setAuth({ ...user, name: updated.name }, at, rt)
      }
      toast.success('Perfil atualizado!')
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message ?? 'Erro ao salvar'),
  })

  async function handleSaveName() {
    const ok = await confirm({
      title: 'Atualizar nome',
      description: `Deseja alterar seu nome para "${nameForm.name}"?`,
      confirmLabel: 'Salvar',
    })
    if (!ok) return
    startTransition(async () => { updateMutation.mutate({ name: nameForm.name }) })
  }

  async function handleChangePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter ao menos 6 caracteres')
      return
    }
    const ok = await confirm({
      title: 'Alterar senha',
      description: 'Deseja alterar sua senha?',
      confirmLabel: 'Alterar',
      variant: 'destructive',
    })
    if (!ok) return
    startTransition(async () => {
      updateMutation.mutate(
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        {
          onSuccess: () => setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }),
        },
      )
    })
  }

  const displayName = profile?.name ?? user?.name ?? ''
  const displayEmail = profile?.email ?? user?.email ?? ''
  const displayRole = (profile?.role ?? user?.role) as keyof typeof ROLE_LABELS | undefined

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>

      {/* Cabeçalho com avatar */}
      <div className="flex items-center gap-4">
        <Avatar name={displayName} size="lg" />
        <div>
          <p className="text-lg font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-gray-500">{displayEmail}</p>
          {displayRole && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {ROLE_LABELS[displayRole]}
            </span>
          )}
        </div>
      </div>

      {/* Alterar nome */}
      <Card className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Informações pessoais</p>
          <p className="text-xs text-gray-400 mt-0.5">Atualize seu nome de exibição</p>
        </div>
        <Input
          label="Nome"
          value={nameForm.name}
          onChange={(e) => setNameForm({ name: e.target.value })}
          placeholder="Seu nome completo"
        />
        <Input label="Email" value={displayEmail} disabled className="opacity-60 cursor-not-allowed" />
        <Button loading={isPending || updateMutation.isPending} onClick={handleSaveName}>
          Salvar nome
        </Button>
      </Card>

      {/* Alterar senha */}
      <Card className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Alterar senha</p>
          <p className="text-xs text-gray-400 mt-0.5">Use uma senha com ao menos 6 caracteres</p>
        </div>
        <Input
          label="Senha atual"
          type="password"
          value={pwForm.currentPassword}
          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          placeholder="••••••••"
        />
        <Input
          label="Nova senha"
          type="password"
          value={pwForm.newPassword}
          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          placeholder="••••••••"
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          value={pwForm.confirmPassword}
          onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          placeholder="••••••••"
        />
        <Button
          variant="outline"
          loading={isPending || updateMutation.isPending}
          onClick={handleChangePassword}
        >
          Alterar senha
        </Button>
      </Card>
    </div>
  )
}
