'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/theme/cn'

interface MobileTopBarProps {
  title?: string
  showLogo?: boolean
  showNotifications?: boolean
  className?: string
  children?: React.ReactNode
}

export function MobileTopBar({
  title,
  showLogo = true,
  showNotifications = true,
  className,
  children,
}: MobileTopBarProps) {
  return (
    <header
      className={cn(
        'lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4',
        'bg-vista-bg/80 dark:bg-vista-bg-dark/80 backdrop-blur-xl',
        'border-b border-vista-border/50 dark:border-vista-border-dark/50',
        className
      )}
      style={{ paddingTop: 'var(--safe-area-top)' }}
    >
      {showNotifications ? (
        <Link
          href="/notifications"
          className="p-2 -mr-2 rounded-full hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors"
          aria-label="اعلان‌ها"
        >
          <Bell className="w-6 h-6" />
        </Link>
      ) : (
        <div className="w-10" />
      )}

      {children ?? (
        showLogo ? (
          <Link href="/feed" className="font-bauhaus text-2xl vista-gradient-text select-none">
            Vista
          </Link>
        ) : (
          <h1 className="font-bold text-lg">{title}</h1>
        )
      )}

      <div className="w-10" />
    </header>
  )
}
