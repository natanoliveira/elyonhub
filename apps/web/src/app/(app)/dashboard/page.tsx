'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar } from '@/components/ui/avatar'
import { StatCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PIPELINE_STAGE_LABELS } from '@elyonhub/types'
import Link from 'next/link'

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getMetrics(),
  })

  const metrics = data

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  const stageChartData = metrics
    ? Object.entries(metrics.leadsByStage).map(([stage, count]) => ({
        name: PIPELINE_STAGE_LABELS[stage as keyof typeof PIPELINE_STAGE_LABELS] ?? stage,
        leads: count as number,
      }))
    : []

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Saudação */}
      {user && (
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="text-xl font-bold text-foreground">
              {getGreeting()}, {user.name.split(' ')[0]}!
            </p>
            <p className="text-sm text-gray-400">Aqui está o resumo do seu negócio</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Total de Leads"
          value={metrics?.totalLeads ?? 0}
          subtitle="Últimos 30 dias"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Leads Ativos"
          value={metrics?.activeLeads ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${metrics?.conversionRate ?? 0}%`}
          subtitle="Fechados / (Fechados + Perdidos)"
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Em Atraso"
          value={metrics?.overdueLeads ?? 0}
          subtitle="Sem contato recente"
          icon={<AlertCircle className="h-5 w-5" />}
          className={metrics?.overdueLeads > 0 ? 'border-orange-300' : ''}
        />
      </div>

      {metrics?.overdueLeads > 0 && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-orange-700 font-medium">
            {metrics.overdueLeads} lead(s) aguardando follow-up
          </p>
          <Link href="/follow-up" className="text-sm text-orange-600 underline hover:text-orange-800">
            Ver agora →
          </Link>
        </div>
      )}

      <div className="rounded-lg border border-border bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Leads por Etapa</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stageChartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="leads" fill="#553159" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
