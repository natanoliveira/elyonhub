'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function NavigationProgress() {
  const pathname = usePathname()
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  // On pathname change → complete the bar
  useEffect(() => {
    setWidth(100)
    const hide = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 350)
    return () => clearTimeout(hide)
  }, [pathname])

  // Intercept link clicks to start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      if (href === pathname) return
      setVisible(true)
      setWidth(65)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  if (!visible && width === 0) return null

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-primary transition-all ease-out"
      style={{
        width: `${width}%`,
        transitionDuration: width === 100 ? '200ms' : '400ms',
        opacity: visible || width > 0 ? 1 : 0,
      }}
    />
  )
}
