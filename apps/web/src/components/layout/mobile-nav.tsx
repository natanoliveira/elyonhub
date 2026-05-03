'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Kanban, MessageSquare, Users, Clock } from 'lucide-react'

const mobileNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/follow-up', label: 'Follow-up', icon: Clock },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-white md:hidden">
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-gray-400',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
