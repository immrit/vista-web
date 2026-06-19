'use client'

import { DesktopSidebar } from './DesktopSidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { cn } from '@/lib/theme/cn'

interface AppShellProps {
  children: React.ReactNode
  showMobileNav?: boolean
  showDesktopSidebar?: boolean
  className?: string
  unreadCount?: number
}

export function AppShell({
  children,
  showMobileNav = true,
  showDesktopSidebar = true,
  className,
  unreadCount = 0,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-vista-bg dark:bg-vista-bg-dark">
      {showDesktopSidebar && <DesktopSidebar />}

      <main
        id="main-content"
        className={cn(
          'min-h-screen transition-all duration-300',
          showDesktopSidebar && 'lg:mr-sidebar',
          showMobileNav && 'pb-bottom-nav lg:pb-0',
          className
        )}
      >
        {children}
      </main>

      {showMobileNav && <MobileBottomNav unreadCount={unreadCount} />}
    </div>
  )
}
