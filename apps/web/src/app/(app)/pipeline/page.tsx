'use client'

import { useTransition } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pipelineService } from '@/services/pipeline.service'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { PIPELINE_STAGE_LABELS, PipelineStage } from '@elyonhub/types'
import { formatPhoneBR, isOverdue } from '@elyonhub/utils'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const STAGE_COLORS: Record<string, string> = {
  NEW: 'border-t-blue-400',
  CONTACT: 'border-t-yellow-400',
  NEGOTIATION: 'border-t-orange-400',
  PROPOSAL: 'border-t-purple-400',
  CLOSED: 'border-t-green-400',
  LOST: 'border-t-red-400',
}

export default function PipelinePage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()

  const { data: board, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: pipelineService.getBoard,
  })

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const leadId = active.id as string
    const toStage = over.id as string
    const toLabel = PIPELINE_STAGE_LABELS[toStage as keyof typeof PIPELINE_STAGE_LABELS]

    const ok = await confirm({
      title: 'Mover lead',
      description: `Deseja mover este lead para "${toLabel}"?`,
      confirmLabel: 'Mover',
      variant: toStage === 'LOST' ? 'destructive' : 'default',
    })
    if (!ok) return

    startTransition(async () => {
      try {
        await pipelineService.moveStage(leadId, toStage)
        qc.invalidateQueries({ queryKey: ['pipeline'] })
      } catch {
        toast.error('Erro ao mover lead')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 flex gap-4 overflow-x-auto">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-60 shrink-0" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-6 scrollbar-hide flex-1">
          {Object.values(PipelineStage).map((stage) => {
            const leads = board?.[stage] ?? []
            return (
              <div
                key={stage}
                id={stage}
                className={`flex flex-col shrink-0 w-60 rounded-lg border-t-4 border border-border bg-white ${STAGE_COLORS[stage]}`}
              >
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">
                    {PIPELINE_STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs font-bold text-white bg-primary rounded-full px-2 py-0.5">
                    {leads.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                  {leads.map((lead: any) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="rounded-md border border-border bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                        {isOverdue(lead.lastContact, 3) && (
                          <AlertCircle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatPhoneBR(lead.phone)}</p>
                      {lead.assignedUser && (
                        <p className="text-xs text-gray-400 mt-1">👤 {lead.assignedUser.name}</p>
                      )}
                    </Link>
                  ))}
                  {leads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300 text-xs">
                      Sem leads
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
