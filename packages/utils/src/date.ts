import { format, formatDistanceToNow, parseISO, subDays, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export function fromNow(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
}

export function isOverdue(date: Date | string | null | undefined, days: number): boolean {
  if (!date) return true
  const d = typeof date === 'string' ? parseISO(date) : date
  const threshold = subDays(new Date(), days)
  return !isAfter(d, threshold)
}

export function formatShortTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}
