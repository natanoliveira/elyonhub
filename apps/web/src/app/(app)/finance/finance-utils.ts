import { FinanceStatusExtended } from '@elyonhub/types'

export function paidTotal(record: any): number {
  return (record?.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0)
}

export function effectiveStatus(record: any): FinanceStatusExtended {
  const payments: any[] = record?.payments ?? []
  if (payments.length === 0) return FinanceStatusExtended.PENDING
  const paid = paidTotal(record)
  const total = Number(record.amount)
  if (paid >= total) return FinanceStatusExtended.PAID
  return FinanceStatusExtended.PARTIAL
}
