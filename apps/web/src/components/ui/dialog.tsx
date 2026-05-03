'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl mx-4', className)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted/40 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
