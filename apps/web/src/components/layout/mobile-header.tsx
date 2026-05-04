'use client'

import { Menu } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar.store'

export function MobileHeader() {
  const { toggle } = useSidebarStore()

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 bg-[#1f0d35] px-4 shadow-md">
      <button
        onClick={toggle}
        className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-lg font-bold text-white tracking-tight">Elyon Hub</span>
    </header>
  )
}
