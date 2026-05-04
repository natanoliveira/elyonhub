'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  function show() {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const gap = 6
    let top = 0
    let left = 0
    if (side === 'top') { top = r.top - gap; left = r.left + r.width / 2 }
    else if (side === 'bottom') { top = r.bottom + gap; left = r.left + r.width / 2 }
    else if (side === 'left') { top = r.top + r.height / 2; left = r.left - gap }
    else { top = r.top + r.height / 2; left = r.right + gap }
    setPos({ top, left })
  }

  function hide() { setPos(null) }

  const translateClass = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  }[side]

  return (
    <>
      <span ref={ref} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </span>
      {pos && (
        <span
          role="tooltip"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className={cn(
            'pointer-events-none whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white',
            translateClass,
            className,
          )}
        >
          {content}
        </span>
      )}
    </>
  )
}
