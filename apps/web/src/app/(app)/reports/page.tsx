import Link from 'next/link'
import { Users, DollarSign, ScrollText, TrendingUp, ShoppingBag } from 'lucide-react'

const reportCards = [
  {
    href: '/reports/leads',
    icon: Users,
    title: 'Leads',
    description: 'Lista completa com filtros por etapa, status e vendedor',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    pro: false,
  },
  {
    href: '/reports/finance',
    icon: DollarSign,
    title: 'Financeiro',
    description: 'Fluxo de caixa com resumo de receitas, despesas e saldo',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    pro: true,
  },
  {
    href: '/reports/contracts',
    icon: ScrollText,
    title: 'Contratos',
    description: 'Contratos ativos, pendentes e cancelados com valor total',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    pro: true,
  },
  {
    href: '/reports/sales',
    icon: ShoppingBag,
    title: 'Vendas',
    description: 'Leads fechados no período com vendedor responsável',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    pro: false,
  },
  {
    href: '/reports/conversion',
    icon: TrendingUp,
    title: 'Conversão',
    description: 'Funil do pipeline com percentuais de conversão por etapa',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    pro: false,
  },
]

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1">Selecione um módulo para visualizar e exportar relatórios em PDF</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="flex flex-col rounded-lg border border-border bg-white p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-full ${r.iconBg} p-3`}>
                <r.icon className={`h-5 w-5 ${r.iconColor}`} />
              </div>
              {r.pro && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  PRO
                </span>
              )}
            </div>
            <div className="mt-4 flex-1">
              <p className="font-semibold text-foreground">{r.title}</p>
              <p className="text-sm text-gray-500 mt-1">{r.description}</p>
            </div>
            <p className="mt-4 text-xs font-medium text-primary">Ver relatório →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
