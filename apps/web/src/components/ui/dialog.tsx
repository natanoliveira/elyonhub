'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setClosing(false)
      setMounted(true)
    } else if (mounted && !closing) {
      setClosing(true)
      const t = setTimeout(() => { setMounted(false); setClosing(false) }, 150)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    if (mounted && !closing) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [mounted, closing])

  function handleClose() {
    setClosing(true)
    setTimeout(() => { setMounted(false); setClosing(false); onClose() }, 150)
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          'absolute inset-0 bg-black/50',
          closing ? 'animate-dialog-backdrop-out' : 'animate-dialog-backdrop-in',
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl mx-4',
          closing ? 'animate-dialog-panel-out' : 'animate-dialog-panel-in',
          className,
        )}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 hover:bg-muted/50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
