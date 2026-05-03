'use client'

import { useQuery } from '@tanstack/react-query'
import { leadsService } from '@/services/leads.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatPhoneBR, formatDateTimeBR } from '@elyonhub/utils'
import { PIPELINE_STAGE_LABELS } from '@elyonhub/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<'info' | 'history'>('info')

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', params.id],
    queryFn: () => leadsService.get(params.id),
  })

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!lead) return <div className="p-6 text-gray-400">Lead não encontrado</div>

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/leads" className="text-gray-400 hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">{lead.name}</h1>
        <Badge label={PIPELINE_STAGE_LABELS[lead.pipelineStage as keyof typeof PIPELINE_STAGE_LABELS]} stage={lead.pipelineStage} />
      </div>

      <div className="flex gap-2 border-b border-border">
        {(['info', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'}`}
          >
            {t === 'info' ? 'Informações' : 'Histórico'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="rounded-lg border border-border bg-white p-4 space-y-3 max-w-lg">
          <div>
            <p className="text-xs text-gray-400">Telefone</p>
            <p className="text-sm font-medium">{formatPhoneBR(lead.phone)}</p>
          </div>
          {lead.email && (
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium">{lead.email}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Vendedor</p>
            <p className="text-sm font-medium">{lead.assignedUser?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Origem</p>
            <p className="text-sm font-medium capitalize">{lead.source?.toLowerCase()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Criado em</p>
            <p className="text-sm font-medium">{formatDateTimeBR(lead.createdAt)}</p>
          </div>
          {lead.notes && (
            <div>
              <p className="text-xs text-gray-400">Observações</p>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2 max-w-lg">
          {lead.pipelineEvents?.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum evento de pipeline ainda</p>
          )}
          {lead.pipelineEvents?.map((evt: any) => (
            <div key={evt.id} className="flex items-start gap-3 rounded-lg border border-border bg-white p-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{PIPELINE_STAGE_LABELS[evt.fromStage as keyof typeof PIPELINE_STAGE_LABELS]}</span>
                  {' → '}
                  <span className="font-medium">{PIPELINE_STAGE_LABELS[evt.toStage as keyof typeof PIPELINE_STAGE_LABELS]}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {evt.user ? `Por ${evt.user.name}` : 'Automático'} · {formatDateTimeBR(evt.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
