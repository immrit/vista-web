'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import { usePresence } from '@/hooks/usePresence'
import { cn } from '@/lib/theme/cn'

interface SuggestedUsersPanelProps {
  users: Profile[]
  currentUserId?: string
  onFollow?: (userId: string) => void
  className?: string
}

export function SuggestedUsersPanel({
  users,
  currentUserId,
  onFollow,
  className,
}: SuggestedUsersPanelProps) {
  const router = useRouter()
  const { isUserOnline } = usePresence()

  const filtered = users.filter(u => u.id !== currentUserId)

  return (
    <aside className={cn('hidden lg:block', className)}>
      <div className="sticky top-6 space-y-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-vista-text-primary dark:text-vista-text-primary-dark">
              پیشنهاد برای شما
            </h3>
            <Link
              href="/explore"
              className="text-xs text-vista-primary hover:text-vista-primary-dark transition-colors"
            >
              مشاهده همه
            </Link>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark text-center py-4">
              فعلاً پیشنهادی وجود ندارد
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.slice(0, 5).map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 group cursor-pointer"
                  onClick={() => router.push(`/profile/${user.username}`)}
                >
                  <div className="relative shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-vista-gradient flex items-center justify-center text-white font-semibold text-sm">
                        {(user.full_name || user.username || 'و').charAt(0)}
                      </div>
                    )}
                    {isUserOnline(user.id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-vista-success border-2 border-vista-surface dark:border-vista-surface-dark rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-vista-primary transition-colors">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark truncate">
                      @{user.username}
                    </p>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onFollow?.(user.id)
                    }}
                    className="text-xs font-semibold text-vista-primary hover:text-vista-primary-dark transition-colors shrink-0"
                  >
                    دنبال کن
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-2 text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark space-y-1">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/settings" className="hover:underline">درباره</Link>
            <Link href="/settings" className="hover:underline">حریم خصوصی</Link>
            <Link href="/settings" className="hover:underline">قوانین</Link>
          </div>
          <p>© {new Date().getFullYear()} Vista</p>
        </div>
      </div>
    </aside>
  )
}
