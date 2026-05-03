'use client'

import { useQuery } from '@tanstack/react-query'
import { leadsService } from '@/services/leads.service'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPhoneBR, fromNow } from '@elyonhub/utils'
import { Clock } from 'lucide-react'
import Link from 'next/link'

export default function FollowUpPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['follow-up'],
    queryFn: () => leadsService.list({ overdue: true }),
  })

  const leads = data?.data ?? []

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-6 w-6 text-orange-400" />
        <h1 className="text-2xl font-bold text-foreground">Follow-up</h1>
        {leads.length > 0 && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
            {leads.length}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">Leads que estão aguardando retorno há mais de 3 dias</p>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-xl">🎉</p>
          <p className="text-lg font-medium mt-2">Nenhum lead em atraso</p>
          <p className="text-sm">Continue assim!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead: any) => (
            <div key={lead.id} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div>
                <p className="font-medium text-foreground">{lead.name}</p>
                <p className="text-sm text-gray-500">{formatPhoneBR(lead.phone)}</p>
                <p className="text-xs text-orange-500 mt-1">
                  {lead.lastContact ? `Último contato ${fromNow(lead.lastContact)}` : 'Sem contato'}
                </p>
              </div>
              <Link
                href={`/inbox`}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-alt transition-colors"
              >
                Conversar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
