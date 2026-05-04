'use client'

import { useTransition, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pipelineService } from '@/services/pipeline.service'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { PIPELINE_STAGE_LABELS, PipelineStage } from '@elyonhub/types'
import { formatPhoneBR, isOverdue } from '@elyonhub/utils'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  NEW: 'border-t-blue-400',
  CONTACT: 'border-t-yellow-400',
  NEGOTIATION: 'border-t-orange-400',
  PROPOSAL: 'border-t-purple-400',
  CLOSED: 'border-t-green-400',
  LOST: 'border-t-red-400',
}

function CardContent({ lead }: { lead: any }) {
  return (
    <>
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
    </>
  )
}

function DraggableCard({ lead, stage }: { lead: any; stage: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stage },
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-md border border-border bg-white p-3 shadow-sm select-none touch-none',
        isDragging
          ? 'opacity-30 cursor-grabbing'
          : 'cursor-grab hover:shadow-md hover:border-primary/40 transition-all',
      )}
    >
      <Link
        href={`/leads/${lead.id}`}
        className="block"
        onClick={(e) => { if (isDragging) e.preventDefault() }}
        draggable={false}
      >
        <CardContent lead={lead} />
      </Link>
    </div>
  )
}

function DroppableColumn({
  stage,
  leads,
  isOver,
}: {
  stage: string
  leads: any[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stage })

  return (
    <div
      className={cn(
        `flex flex-col shrink-0 w-60 rounded-lg border-t-4 border ${STAGE_COLORS[stage]} transition-colors duration-150`,
        isOver ? 'border-primary/40 bg-primary/5' : 'border-border bg-white',
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          {PIPELINE_STAGE_LABELS[stage as PipelineStage]}
        </span>
        <span className="text-xs font-bold text-white bg-primary rounded-full px-2 py-0.5">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] min-h-[100px]"
      >
        {leads.map((lead: any) => (
          <DraggableCard key={lead.id} lead={lead} stage={stage} />
        ))}

        {leads.length === 0 && (
          <div
            className={cn(
              'flex items-center justify-center rounded-md py-8 text-xs transition-colors',
              isOver ? 'text-primary/60 bg-primary/10 border border-dashed border-primary/30' : 'text-gray-300',
            )}
          >
            {isOver ? 'Soltar aqui' : 'Sem leads'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const { data: board, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: pipelineService.getBoard,
  })

  const activeLead = activeId
    ? Object.values<any[]>(board ?? {}).flat().find((l: any) => l.id === activeId)
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id as string ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const leadId = active.id as string
    const fromStage = active.data.current?.stage as string
    const toStage = over.id as string

    if (fromStage === toStage) return

    const toLabel = PIPELINE_STAGE_LABELS[toStage as PipelineStage]

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

  function handleDragCancel() {
    setActiveId(null)
    setOverId(null)
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-6 flex-1">
          {Object.values(PipelineStage).map((stage) => (
            <DroppableColumn
              key={stage}
              stage={stage}
              leads={board?.[stage] ?? []}
              isOver={overId === stage}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div className="rounded-md border-2 border-primary bg-white p-3 shadow-2xl w-56 rotate-2 opacity-95 cursor-grabbing">
              <CardContent lead={activeLead} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
