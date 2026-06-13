'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/lib/socialApi'
import { useAuth } from '@/hooks/useAuth'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { cn } from '@/lib/theme/cn'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'

interface Notification {
  id: string
  type?: string
  title?: string
  body?: string
  message?: string
  created_at?: string
  read?: boolean
  is_read?: boolean
  actor?: { username?: string; avatar_url?: string; full_name?: string }
}

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(50),
    enabled: Boolean(user),
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  const notifications = (data?.notifications || []) as Notification[]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <MobileTopBar title="اعلان‌ها" showLogo={false} showNotifications={false}>
        <h1 className="font-bold text-lg">اعلان‌ها</h1>
      </MobileTopBar>

      <div className="feed-container lg:pt-6">
        <div className="lg:glass-card lg:overflow-hidden border-x border-vista-border dark:border-vista-border-dark lg:border lg:rounded-2xl">
          <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-vista-border dark:border-vista-border-dark">
            <h1 className="font-bold text-xl">اعلان‌ها</h1>
            {notifications.length > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-2 text-sm text-vista-primary hover:text-vista-primary-dark transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                خواندن همه
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <div className="w-10 h-10 rounded-full skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 skeleton rounded" />
                    <div className="h-2 w-1/4 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-vista-surface-variant dark:bg-vista-surface-variant-dark flex items-center justify-center">
                <Bell className="w-8 h-8 text-vista-text-secondary dark:text-vista-text-secondary-dark" />
              </div>
              <p className="font-semibold mb-1">اعلانی وجود ندارد</p>
              <p className="text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark">
                وقتی فعالیتی رخ دهد اینجا نمایش داده می‌شود
              </p>
            </div>
          ) : (
            <div className="divide-y divide-vista-border dark:divide-vista-border-dark">
              {notifications.map(notif => {
                const isRead = notif.read || notif.is_read
                const text = notif.body || notif.message || notif.title || ''
                const time = notif.created_at
                  ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: faIR })
                  : ''

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex gap-3 px-4 py-4 hover:bg-vista-surface-variant/50 dark:hover:bg-vista-surface-variant-dark/50 transition-colors cursor-pointer',
                      !isRead && 'bg-vista-primary-light/30 dark:bg-vista-primary/5'
                    )}
                  >
                    {notif.actor?.avatar_url ? (
                      <img src={notif.actor.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-vista-gradient flex items-center justify-center text-white font-semibold shrink-0">
                        {(notif.actor?.full_name || notif.actor?.username || 'و').charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{text}</p>
                      <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark mt-1">{time}</p>
                    </div>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-vista-primary shrink-0 mt-2" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
