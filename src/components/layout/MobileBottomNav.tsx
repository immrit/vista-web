'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Mail, User, Plus } from 'lucide-react'
import { cn } from '@/lib/theme/cn'

interface MobileBottomNavProps {
  unreadCount?: number
}

const tabs = [
  { href: '/feed', icon: Home, label: 'خانه', index: 0 },
  { href: '/explore', icon: Search, label: 'جستجو', index: 1 },
  { href: '/post', icon: Plus, label: 'پست', index: 2, isAdd: true },
  { href: '/messages', icon: Mail, label: 'پیام‌ها', index: 3, badge: true },
  { href: '/profile', icon: User, label: 'پروفایل', index: 4 },
]

export function MobileBottomNav({ unreadCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Gradient halo */}
      <div className="absolute inset-x-0 bottom-0 h-28 nav-halo pointer-events-none" />

      {/* Glass island */}
      <div className="relative px-4 pb-[calc(1.75rem+var(--safe-area-bottom))] pt-2 pointer-events-auto">
        <nav
          className="glass-island rounded-island px-2 py-2 shadow-xl shadow-black/5 dark:shadow-black/30"
          aria-label="ناوبری اصلی"
        >
          <div className="flex items-center justify-around">
            {tabs.map(({ href, icon: Icon, label, isAdd, badge }) => {
              const active = isActive(href)

              if (isAdd) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-center w-12 h-12 -mt-5 bg-vista-gradient rounded-full shadow-lg shadow-vista-primary/40 text-white hover:opacity-90 active:scale-95 transition-all"
                    aria-label={label}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                  </Link>
                )
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-2xl transition-all duration-200',
                    active
                      ? 'text-vista-primary'
                      : 'text-vista-text-secondary dark:text-vista-text-secondary-dark'
                  )}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon
                      className={cn('w-6 h-6 transition-transform', active && 'scale-110')}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {badge && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-vista-error text-white text-[10px] font-bold rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={cn('text-[10px] mt-0.5', active && 'font-semibold')}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
