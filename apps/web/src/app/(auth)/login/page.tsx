'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, MessageSquare, Kanban, TrendingUp, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'

const features = [
  { icon: MessageSquare, text: 'Inbox WhatsApp centralizado' },
  { icon: Kanban,        text: 'Pipeline Kanban automático' },
  { icon: TrendingUp,    text: 'Dashboard com métricas em tempo real' },
  { icon: Shield,        text: 'Multi-empresa com isolamento total' },
]

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
        const { accessToken, refreshToken, user } = await authService.login(email, password)
        setAuth(user, accessToken, refreshToken)
        document.cookie = `accessToken=${accessToken}; path=/; max-age=900; SameSite=Lax`
        toast.success(`Bem-vindo, ${user.name}!`)
        router.push('/dashboard')
      } catch (err: any) {
        const message = err.response?.data?.error?.message ?? 'Credenciais inválidas'
        setError(Array.isArray(message) ? message[0] : message)
      }
    })
  }

  return (
    <div className="flex min-h-screen">

      {/* Lado esquerdo — descrição */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-gradient-to-br from-primary to-primary-alt p-12 text-white">
        <div>
          <span className="text-2xl font-bold tracking-tight">Elyon Hub</span>
          <p className="mt-1 text-sm text-white/60">by Natan Sousa Tech</p>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Transforme mensagens<br />em negócios fechados.
          </h1>
          <p className="mt-4 text-lg text-white/75 leading-relaxed">
            CRM conversacional WhatsApp-first que captura leads automaticamente,
            organiza seu pipeline e aumenta a conversão sem esforço manual.
          </p>

          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">© {new Date().getFullYear()} Natan Sousa Tech · Todos os direitos reservados</p>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center bg-white px-8 py-12">
        <div className="mb-8 text-center md:hidden">
          <span className="text-2xl font-bold text-primary">Elyon Hub</span>
          <p className="mt-1 text-xs text-gray-400">by Natan Sousa Tech</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Entrar na sua conta</h2>
            <p className="mt-1 text-sm text-gray-500">Use o email da sua empresa para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="voce@suaempresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" loading={isPending} className="w-full" size="lg">
              Entrar
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Não tem acesso?{' '}
            <a href="/#planos" className="text-primary hover:underline">Conheça os planos</a>
          </p>
        </div>
      </div>
    </div>
  )
}
