'use client'

import { useTransition, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import api from '@/lib/api'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'plan' | 'company' | 'admin'

const STEPS: { key: Step; label: string }[] = [
  { key: 'plan',    label: 'Plano' },
  { key: 'company', label: 'Empresa' },
  { key: 'admin',   label: 'Acesso' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('plan')

  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [emailDomain, setEmailDomain] = useState('')
  const [domainStatus, setDomainStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [domainReason, setDomainReason] = useState('')
  const domainTimer = useRef<NodeJS.Timeout | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    api.get('/plans').then((r) => setPlans(r.data.data ?? [])).catch(() => {})
  }, [])

  // Valida domínio com debounce de 600ms
  useEffect(() => {
    if (!emailDomain) { setDomainStatus('idle'); return }
    setDomainStatus('checking')
    if (domainTimer.current) clearTimeout(domainTimer.current)
    domainTimer.current = setTimeout(async () => {
      try {
        const result = await authService.validateDomain(emailDomain)
        setDomainStatus(result.valid ? 'valid' : 'invalid')
        setDomainReason(result.reason ?? '')
      } catch {
        setDomainStatus('invalid')
        setDomainReason('Erro ao verificar o domínio.')
      }
    }, 600)
  }, [emailDomain])

  // Preenche domínio automaticamente quando o e-mail for digitado
  useEffect(() => {
    const parts = email.split('@')
    if (parts.length === 2 && parts[1]) setEmailDomain(parts[1])
  }, [email])

  function canAdvancePlan() { return !!selectedPlan }
  function canAdvanceCompany() { return companyName.trim() && emailDomain.trim() && domainStatus === 'valid' }
  function canSubmit() {
    return name.trim() && email.trim() && password.length >= 6 && password === confirmPassword
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await authService.register({
          companyName,
          emailDomain,
          name,
          email,
          password,
          planId: selectedPlan,
        })
        toast.success('Conta criada! Verifique seu e-mail para ativar o acesso.')
        router.push('/login')
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message ?? 'Erro ao criar conta'
        toast.error(Array.isArray(msg) ? msg[0] : msg)
      }
    })
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-gradient-to-br from-primary to-primary-alt p-12 text-white">
        <span className="text-2xl font-bold tracking-tight">Elyon Hub</span>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Comece agora.<br />Escale depois.
          </h1>
          <p className="mt-4 text-lg text-white/75 leading-relaxed">
            Crie sua conta em menos de 2 minutos e comece a converter leads em clientes.
          </p>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Natan Sousa Tech · Todos os direitos reservados</p>
      </div>

      {/* Lado direito */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-2 text-center md:hidden">
            <span className="text-2xl font-bold text-primary">Elyon Hub</span>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-foreground">Criar conta</h2>
          <p className="mb-6 text-sm text-gray-500">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
          </p>

          {/* Stepper */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    i < stepIndex ? 'bg-primary text-white' :
                    i === stepIndex ? 'bg-primary text-white ring-4 ring-primary/20' :
                    'bg-gray-100 text-gray-400'
                  )}>
                    {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn('mt-1 text-xs', i === stepIndex ? 'text-primary font-medium' : 'text-gray-400')}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mx-2 mb-4', i < stepIndex ? 'bg-primary' : 'bg-gray-200')} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1 — Plano */}
          {step === 'plan' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground mb-3">Escolha seu plano</p>
              <div className="space-y-3">
                {plans.map((p) => (
                  <label key={p.id} className={cn(
                    'flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors',
                    selectedPlan === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  )}>
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={selectedPlan === p.id}
                      onChange={() => setSelectedPlan(p.id)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground capitalize">{p.name}</span>
                        <span className="text-sm font-bold text-primary">R$ {Number(p.price).toFixed(0)}/mês</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        até {p.maxUsers === 9999 ? 'ilimitados' : p.maxUsers} usuários · {p.maxLeads === 9999999 ? 'leads ilimitados' : `${p.maxLeads.toLocaleString('pt-BR')} leads`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <Button className="w-full mt-2" disabled={!canAdvancePlan()} onClick={() => setStep('company')}>
                Continuar
              </Button>
            </div>
          )}

          {/* Step 2 — Empresa */}
          {step === 'company' && (
            <div className="space-y-4">
              <Input
                label="Nome da empresa *"
                placeholder="Minha Empresa Ltda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium">Domínio do e-mail corporativo *</label>
                <div className="relative">
                  <Input
                    placeholder="minhaempresa.com.br"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value.toLowerCase().trim())}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {domainStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    {domainStatus === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {domainStatus === 'invalid' && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                {domainStatus === 'invalid' && (
                  <p className="mt-1 text-xs text-red-500">{domainReason}</p>
                )}
                {domainStatus === 'valid' && (
                  <p className="mt-1 text-xs text-green-600">Domínio verificado — e-mails podem ser recebidos.</p>
                )}
                <p className="mt-1 text-xs text-gray-400">Use o domínio da sua empresa, não @gmail ou @hotmail.</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('plan')}>Voltar</Button>
                <Button className="flex-1" disabled={!canAdvanceCompany()} onClick={() => setStep('admin')}>Continuar</Button>
              </div>
            </div>
          )}

          {/* Step 3 — Admin */}
          {step === 'admin' && (
            <div className="space-y-4">
              <Input
                label="Seu nome *"
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="E-mail corporativo *"
                type="email"
                placeholder={`joao@${emailDomain || 'suaempresa.com.br'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Senha *"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Confirmar senha *"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">As senhas não coincidem.</p>
              )}
              {email && !email.endsWith(`@${emailDomain}`) && (
                <p className="text-xs text-amber-500">O e-mail deve ser @{emailDomain}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('company')}>Voltar</Button>
                <Button
                  className="flex-1"
                  disabled={!canSubmit() || isPending}
                  loading={isPending}
                  onClick={handleSubmit}
                >
                  Criar conta
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
