'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

export function LogoutButton() {
  const { clearAuth } = useAuthStore()
  const router = useRouter()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()

  async function handleLogout() {
    const ok = await confirm({
      title: 'Sair do sistema',
      description: 'Deseja realmente encerrar sua sessão?',
      confirmLabel: 'Sair',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    })
    if (!ok) return

    startTransition(async () => {
      try {
        await authService.logout()
      } finally {
        clearAuth()
        document.cookie = 'accessToken=; path=/; max-age=0'
        router.push('/login')
        toast.success('Até logo!')
      }
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      title="Sair"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-destructive hover:scale-110 disabled:opacity-60 disabled:pointer-events-none"
    >
      <LogOut className="h-5 w-5" />
    </button>
  )
}
