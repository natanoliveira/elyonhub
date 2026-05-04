import { cn } from '@/lib/utils'

const stageColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACT: 'bg-yellow-100 text-yellow-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  PROPOSAL: 'bg-purple-100 text-purple-700',
  CLOSED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700',
}

const variantClasses = {
  default: 'bg-muted text-primary',
  secondary: 'bg-gray-100 text-gray-600',
  success: 'bg-green-100 text-green-700',
  destructive: 'bg-red-100 text-red-600',
  warning: 'bg-yellow-100 text-yellow-700',
}

interface BadgeProps {
  label?: string
  stage?: string
  variant?: keyof typeof variantClasses
  className?: string
  children?: React.ReactNode
}

export function Badge({ label, stage, variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        stage ? stageColors[stage] ?? 'bg-gray-100 text-gray-600' : variantClasses[variant],
        className,
      )}
    >
      {children ?? label}
    </span>
  )
}
