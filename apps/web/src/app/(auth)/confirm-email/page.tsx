'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/services/auth.service'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ConfirmEmailInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Token inválido.'); return }
    authService.confirmEmail(token)
      .then((r) => { setStatus('success'); setMessage(r.message) })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.response?.data?.error?.message ?? 'Token inválido ou expirado.')
      })
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-10 shadow-sm text-center">
        <div className="mb-4 text-2xl font-bold text-primary">Elyon Hub</div>

        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Verificando seu e-mail...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">E-mail confirmado!</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Fazer login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Link inválido</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link href="/login">
              <Button variant="outline" className="w-full">Voltar ao login</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ConfirmEmailInner />
    </Suspense>
  )
}
