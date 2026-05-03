import Link from 'next/link'
import { Check, MessageSquare, Kanban, TrendingUp, Users, Clock, FileText } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'R$ 97',
    highlight: false,
    features: ['2 usuários', '500 leads/mês', '1 número WhatsApp', 'Pipeline Kanban', 'Relatório básico', 'Suporte por email'],
  },
  {
    name: 'Pro',
    price: 'R$ 297',
    highlight: true,
    features: ['10 usuários', '5.000 leads/mês', '3 números WhatsApp', 'Tudo do Starter', 'Relatórios completos', 'Suporte via chat'],
  },
  {
    name: 'Scale',
    price: 'R$ 697',
    highlight: false,
    features: ['Usuários ilimitados', 'Leads ilimitados', 'Números ilimitados', 'Tudo do Pro', 'API personalizada', 'Suporte dedicado'],
  },
]

const features = [
  { icon: MessageSquare, title: 'Inbox WhatsApp', desc: 'Atenda todos os leads em um único lugar, sem trocar de app.' },
  { icon: Kanban, title: 'Pipeline Kanban', desc: 'Visualize e organize seus leads em cada etapa da venda.' },
  { icon: Clock, title: 'Follow-up automático', desc: 'Alertas para leads parados. Nunca perca uma oportunidade.' },
  { icon: TrendingUp, title: 'Dashboard', desc: 'Métricas de conversão e desempenho em tempo real.' },
  { icon: Users, title: 'Multi-usuário', desc: 'Gerencie toda a equipe de vendas em um só sistema.' },
  { icon: FileText, title: 'Relatórios PDF', desc: 'Gere relatórios de leads e vendas com um clique.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-6 backdrop-blur">
        <span className="text-xl font-bold text-primary">Elyon Hub</span>
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-alt transition-colors"
        >
          Entrar
        </Link>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-alt py-20 px-6 text-center text-white">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Transforme WhatsApp<br />em motor de vendas
        </h1>
        <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
          CRM conversacional que captura leads automaticamente, organiza o pipeline e aumenta sua conversão — sem esforço manual.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-primary hover:bg-muted transition-colors"
          >
            Quero começar agora →
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Conecte o WhatsApp', desc: 'Vincule seu número em segundos via Evolution API.' },
              { step: '2', title: 'Leads chegam sozinhos', desc: 'Cada mensagem recebida vira um lead automaticamente.' },
              { step: '3', title: 'Feche mais negócios', desc: 'Acompanhe o pipeline e nunca perca um follow-up.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-border">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">Tudo que você precisa</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-2 p-4 rounded-xl border border-border hover:border-primary/40 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-16 px-6 bg-gray-50" id="planos">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">Planos e preços</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${plan.highlight ? 'border-primary shadow-lg shadow-primary/10' : 'border-border bg-white'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-0.5 text-xs font-bold text-white">
                    Mais popular
                  </div>
                )}
                <div className={`rounded-xl p-4 mb-4 ${plan.highlight ? 'bg-primary text-white' : 'bg-muted/30'}`}>
                  <p className="font-bold text-lg">{plan.name}</p>
                  <p className={`text-3xl font-bold mt-1 ${plan.highlight ? 'text-white' : 'text-foreground'}`}>
                    {plan.price}<span className="text-sm font-normal opacity-70">/mês</span>
                  </p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${plan.highlight ? 'bg-primary text-white hover:bg-primary-alt' : 'border border-primary text-primary hover:bg-primary hover:text-white'}`}
                >
                  Começar agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-6 bg-primary text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Pronto para aumentar suas vendas?</h2>
        <p className="text-white/80 mb-8">Comece com o plano Starter e escale conforme seu negócio crescer.</p>
        <Link
          href="/login"
          className="rounded-lg bg-white px-8 py-3 font-semibold text-primary hover:bg-muted transition-colors"
        >
          Começar grátis por 7 dias
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-gray-400">
        <p className="font-semibold text-foreground mb-1">Natan Sousa Tech</p>
        <p>© {new Date().getFullYear()} Elyon Hub · Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
