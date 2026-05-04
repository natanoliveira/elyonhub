import { FINANCE_TYPE_LABELS, FINANCE_STATUS_EXTENDED_LABELS } from '@elyonhub/types'

interface Props {
  filterType: string
  filterStatus: string
  onTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function FinanceFilters({ filterType, filterStatus, onTypeChange, onStatusChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        value={filterType}
        onChange={(e) => onTypeChange(e.target.value)}
        className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground"
      >
        <option value="">Todos os tipos</option>
        {Object.entries(FINANCE_TYPE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <select
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground"
      >
        <option value="">Todos os status</option>
        {Object.entries(FINANCE_STATUS_EXTENDED_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  )
}
