'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useSidebarStore } from '@/stores/sidebar.store'
import { Avatar } from '@/components/ui/avatar'
import {
  LayoutDashboard, Kanban, MessageSquare, Users, Clock,
  DollarSign, ScrollText, FileText, Settings, X, ShieldCheck,
} from 'lucide-react'

const ALL_NAV_ITEMS = [
  { key: 'dashboard',   href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { key: 'pipeline',    href: '/pipeline',   label: 'Pipeline',      icon: Kanban },
  { key: 'inbox',       href: '/inbox',      label: 'Inbox',         icon: MessageSquare },
  { key: 'leads',       href: '/leads',      label: 'Leads',         icon: Users },
  { key: 'follow-up',   href: '/follow-up',  label: 'Follow-up',     icon: Clock },
  { key: 'finance',     href: '/finance',    label: 'Financeiro',    icon: DollarSign },
  { key: 'contracts',   href: '/contracts',  label: 'Contratos',     icon: ScrollText },
  { key: 'reports',     href: '/reports',    label: 'Relatórios',    icon: FileText },
  { key: 'settings',    href: '/settings',   label: 'Configurações', icon: Settings },
]

const ROLE_LABELS = { MASTER: 'Master', ADMIN: 'Administrador', SELLER: 'Vendedor' } as const

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { user, allowedMenus, isMaster } = useAuthStore()

  const visibleItems = allowedMenus.length > 0
    ? ALL_NAV_ITEMS.filter((item) => allowedMenus.includes(item.key))
    : ALL_NAV_ITEMS

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10 shrink-0">
        <span className="text-xl font-bold text-white tracking-tight">Elyon Hub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {visibleItems.map(({ key, href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={key}
              href={href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5',
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Master admin links */}
        {isMaster() && (
          <div className="mt-2 pt-3 border-t border-white/10 space-y-0.5">
            {[
              { href: '/admin', label: 'Menus por plano' },
              { href: '/admin/companies', label: 'Empresas' },
              { href: '/admin/email-logs', label: 'Logs de e-mail' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-white/15 text-white'
                    : 'text-white/40 hover:bg-white/10 hover:text-white',
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User block */}
      {user && (
        <Link
          href="/profile"
          onClick={onLinkClick}
          className={cn(
            'flex items-center gap-3 mx-3 mb-4 px-3 py-2.5 rounded-lg transition-all border border-white/10',
            pathname === '/profile'
              ? 'bg-white/15'
              : 'hover:bg-white/10',
          )}
        >
          <Avatar name={user.name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-white/40">{ROLE_LABELS[user.role]}</p>
          </div>
        </Link>
      )}
    </div>
  )
}

export function Sidebar() {
  const { open, close } = useSidebarStore()
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
    setTimeout(() => { setClosing(false); close() }, 200)
  }

  // Close on route change on mobile
  const pathname = usePathname()
  useEffect(() => { close() }, [pathname])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-60 shrink-0 flex-col bg-[#1f0d35]">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/60',
              closing ? 'animate-dialog-backdrop-out' : 'animate-dialog-backdrop-in',
            )}
            onClick={handleClose}
          />
          {/* Drawer panel */}
          <div
            className={cn(
              'relative z-10 flex h-full w-72 flex-col bg-[#1f0d35] shadow-2xl',
              closing ? 'animate-drawer-out' : 'animate-drawer-in',
            )}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onLinkClick={handleClose} />
          </div>
        </div>
      )}
    </>
  )
}
