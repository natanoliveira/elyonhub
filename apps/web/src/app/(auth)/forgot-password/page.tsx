'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await authService.forgotPassword(email)
        setSent(true)
      } catch {
        toast.error('Erro ao processar. Tente novamente.')
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-10 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold text-primary">Elyon Hub</span>
        </div>

        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">E-mail enviado!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Se este e-mail estiver cadastrado, você receberá as instruções de redefinição em breve.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Esqueci minha senha</h2>
            <p className="text-sm text-gray-500 mb-6">
              Informe seu e-mail corporativo e enviaremos as instruções.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="E-mail corporativo"
                type="email"
                placeholder="voce@suaempresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={!email || isPending} loading={isPending}>
                Enviar instruções
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
