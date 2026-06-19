'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  Plus,
  Settings,
  LogOut,
  Gamepad2,
  MapPin,
  Clapperboard,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/theme/cn'
import { Logo } from '@/components/ui/Logo'
import { useState, useRef, useEffect } from 'react'

const navItems = [
  { href: '/feed', icon: Home, label: 'خانه', match: ['/feed'] },
  { href: '/explore', icon: Search, label: 'جستجو', match: ['/explore'] },
  { href: '/nearby', icon: MapPin, label: 'اطراف من', match: ['/nearby'] },
  { href: '/notifications', icon: Bell, label: 'اعلان‌ها', match: ['/notifications'] },
  { href: '/messages', icon: Mail, label: 'پیام‌ها', match: ['/messages'] },
  { href: '/game', icon: Gamepad2, label: 'بازی', match: ['/game'] },
  { href: '/profile', icon: User, label: 'پروفایل', match: ['/profile'] },
]

export function DesktopSidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (match: string[]) =>
    match.some(m => pathname === m || pathname.startsWith(m + '/'))

  const handleLogout = async () => {
    await signOut()
    router.push('/auth')
  }

  return (
    <aside className="hidden lg:flex flex-col fixed top-0 right-0 h-full w-sidebar z-40 px-4 py-6 border-l border-vista-border dark:border-vista-border-dark bg-vista-bg dark:bg-vista-bg-dark">
      <Link href="/feed" className="mb-8 px-3">
        <Logo size="md" variant="default" />
      </Link>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ href, icon: Icon, label, match }) => {
          const active = isActive(match)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-medium transition-all duration-200 group',
                active
                  ? 'text-vista-primary font-bold'
                  : 'text-vista-text-secondary dark:text-vista-text-secondary-dark hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark'
              )}
            >
              <Icon
                className={cn(
                  'w-7 h-7 transition-colors',
                  active ? 'text-vista-primary' : 'group-hover:text-vista-primary'
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span>{label}</span>
            </Link>
          )
        })}

        <Link
          href="/post"
          className="mt-4 flex items-center justify-center gap-2 bg-vista-gradient text-white font-bold text-lg py-3.5 rounded-2xl shadow-lg shadow-vista-primary/25 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="w-6 h-6" />
          <span>پست جدید</span>
        </Link>

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-medium transition-all duration-200 group mt-1',
            pathname.startsWith('/settings')
              ? 'text-vista-primary font-bold'
              : 'text-vista-text-secondary dark:text-vista-text-secondary-dark hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark'
          )}
        >
          <Settings className="w-7 h-7 group-hover:text-vista-primary transition-colors" />
          <span>تنظیمات</span>
        </Link>
      </nav>

      {profile && (
        <div className="relative mt-auto" ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover ring-2 ring-vista-primary/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-vista-gradient flex items-center justify-center text-white font-bold">
                {(profile.full_name || profile.username || 'و').charAt(0)}
              </div>
            )}
            <div className="flex-1 text-right min-w-0">
              <p className="font-semibold text-sm truncate">{profile.full_name || profile.username}</p>
              <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark truncate">
                @{profile.username}
              </p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute bottom-full right-0 left-0 mb-2 bg-vista-surface dark:bg-vista-surface-dark border border-vista-border dark:border-vista-border-dark rounded-2xl shadow-xl overflow-hidden animate-fade-up">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-vista-error hover:bg-vista-error/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>خروج</span>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
