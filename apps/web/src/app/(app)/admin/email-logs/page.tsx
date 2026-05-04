'use client'

import { useEffect, useState, useTransition } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  'confirm-email':  'Confirmação',
  'reset-password': 'Reset de senha',
}
const TYPE_VARIANT: Record<string, 'success' | 'secondary'> = {
  'confirm-email':  'success',
  'reset-password': 'secondary',
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EmailLogsPage() {
  const { isMaster } = useAuthStore()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => { if (!isMaster()) router.replace('/dashboard') }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-email-logs', page],
    queryFn: () => api.get(`/admin/email-logs?page=${page}&limit=50`).then((r) => r.data.data),
    enabled: isMaster(),
  })

  const logs: any[] = data?.data ?? []
  const total: number = data?.total ?? 0

  if (!isMaster()) return null

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs de E-mail</h1>
          <p className="text-sm text-gray-500">Histórico de todos os e-mails enviados pela plataforma</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : (
        <>
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Destinatário</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Assunto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Enviado em</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Ver</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Nenhum e-mail enviado ainda</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{l.to}</p>
                      <p className="text-xs text-gray-400 md:hidden">{formatDateTime(l.sentAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{l.subject}</td>
                    <td className="px-4 py-3">
                      <Badge variant={TYPE_VARIANT[l.type] ?? 'secondary'}>
                        {TYPE_LABELS[l.type] ?? l.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDateTime(l.sentAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setPreview(l)}
                        className="text-gray-400 hover:text-primary"
                        title="Ver conteúdo"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 50 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{total} e-mails no total</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button size="sm" variant="outline" disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview dialog */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview?.subject ?? 'E-mail'}>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Para:</span>
            <span className="font-medium">{preview?.to}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Enviado:</span>
            <span>{preview ? formatDateTime(preview.sentAt) : ''}</span>
          </div>
          <div className="rounded-lg bg-muted/30 px-4 py-3">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{preview?.bodyText}</pre>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
