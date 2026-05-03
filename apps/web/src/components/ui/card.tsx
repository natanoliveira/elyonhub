import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-white p-4 shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, subtitle, icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex items-start justify-between', className)}>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      </div>
      {icon && <div className="rounded-full bg-muted/40 p-2 text-primary">{icon}</div>}
    </Card>
  )
}
