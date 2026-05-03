'use client'

import { useTransition, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { conversationsService } from '@/services/conversations.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPhoneBR, fromNow } from '@elyonhub/utils'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

export default function InboxPage() {
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const { data: conversations, isLoading: loadingList } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsService.list,
    refetchInterval: 10_000,
  })

  const { data: chatData, isLoading: loadingChat } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => conversationsService.get(activeId!),
    enabled: !!activeId,
    refetchInterval: 5_000,
  })

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeId || !message.trim()) return

    const body = message
    setMessage('')
    startTransition(async () => {
      try {
        await conversationsService.sendMessage(activeId, body)
        qc.invalidateQueries({ queryKey: ['conversation', activeId] })
      } catch {
        toast.error('Erro ao enviar mensagem')
      }
    })
  }

  const convList = Array.isArray(conversations) ? conversations : []
  const messages = chatData?.messages ?? []
  const activeLead = chatData?.conversation?.lead

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar de conversas */}
      <div className={`flex flex-col border-r border-border bg-white ${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">Inbox</h1>
        </div>
        {loadingList ? (
          <div className="p-3 space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {convList.map((conv: any) => {
              const lastMsg = conv.messages?.[0]
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border text-left hover:bg-muted/20 transition-colors ${activeId === conv.id ? 'bg-primary/10' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                    {conv.lead?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-foreground truncate">{conv.lead?.name ?? conv.lead?.phone}</p>
                      {lastMsg && <span className="text-[10px] text-gray-400 shrink-0">{fromNow(lastMsg.sentAt)}</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{lastMsg?.body ?? formatPhoneBR(conv.lead?.phone ?? '')}</p>
                  </div>
                </button>
              )
            })}
            {convList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm">
                Nenhuma conversa ainda
              </div>
            )}
          </div>
        )}
      </div>

      {/* Área de chat */}
      {activeId ? (
        <div className="flex flex-col flex-1 bg-gray-50">
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
            <button className="md:hidden text-primary text-sm" onClick={() => setActiveId(null)}>← Voltar</button>
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {activeLead?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{activeLead?.name ?? '—'}</p>
              <p className="text-xs text-gray-400">{formatPhoneBR(activeLead?.phone ?? '')}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingChat ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-2/3" />)}</div>
            ) : (
              messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${msg.direction === 'OUTBOUND' ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-foreground rounded-bl-sm border border-border'}`}>
                    {msg.body}
                    <p className={`text-[10px] mt-1 ${msg.direction === 'OUTBOUND' ? 'text-white/70' : 'text-gray-400'}`}>
                      {fromNow(msg.sentAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 bg-white border-t border-border">
            <Input
              placeholder="Digite uma mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" loading={isPending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-300">
          Selecione uma conversa para começar
        </div>
      )}
    </div>
  )
}
