'use client'

import { useTransition, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function ResetPasswordInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('As senhas não coincidem.'); return }
    startTransition(async () => {
      try {
        await authService.resetPassword(token, password)
        setDone(true)
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message ?? 'Token inválido ou expirado.'
        toast.error(msg)
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-10 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-primary">Elyon Hub</span>
        </div>

        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Senha redefinida!</h2>
            <p className="text-sm text-gray-500 mb-6">Você já pode acessar sua conta com a nova senha.</p>
            <Button className="w-full" onClick={() => router.push('/login')}>Ir para o login</Button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Redefinir senha</h2>
            <p className="text-sm text-gray-500 mb-6">Escolha uma nova senha para sua conta.</p>
            {!token && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                Link inválido. Solicite um novo e-mail de redefinição.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nova senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Confirmar senha"
                type="password"
                placeholder="Repita a nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500">As senhas não coincidem.</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={!password || !confirm || password !== confirm || !token || isPending}
                loading={isPending}
              >
                Redefinir senha
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              <Link href="/login" className="text-primary hover:underline">Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  )
}
