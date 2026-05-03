'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Kanban,
  MessageSquare,
  Users,
  Clock,
  FileText,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/follow-up', label: 'Follow-up', icon: Clock },
  { href: '/reports', label: 'Relatórios', icon: FileText },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex h-full w-60 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-xl font-bold text-primary">Elyon Hub</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 mx-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors mb-0.5',
                active
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-muted/40 hover:text-primary',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
