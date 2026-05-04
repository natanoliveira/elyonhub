import { Sidebar } from '@/components/layout/sidebar'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { LogoutButton } from '@/components/layout/logout-button'
import { PlanMenuLoader } from '@/components/layout/plan-menu-loader'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
      <LogoutButton />
      <PlanMenuLoader />
    </div>
  )
}
