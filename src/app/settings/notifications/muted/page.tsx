'use client'

import { useState, useEffect, useCallback } from 'react'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { blockApi } from '@/lib/socialApi'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

interface MutedUser {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
}

export default function MutedNotificationsPage() {
  const [users, setUsers] = useState<MutedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await blockApi.getMutedNotificationUsers()
      setUsers(data)
    } catch {
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleUnmute = async (userId: string, name: string) => {
    if (!confirm(`اعلان‌های ${name} دوباره فعال شود؟`)) return
    try {
      await blockApi.unmuteNotifications(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('اعلان‌ها فعال شد')
    } catch {
      toast.error('خطا')
    }
  }

  return (
    <SettingsPageShell title="اعلان‌های خاموش‌شده" backHref="/settings/notifications">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto mb-4 text-vista-text-secondary" />
          <p className="font-semibold">هیچ کاربری خاموش نشده</p>
          <p className="text-sm text-vista-text-secondary mt-1">اعلان‌های همه کاربران فعال است</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-4 bg-vista-surface dark:bg-vista-surface-dark rounded-2xl border border-vista-border dark:border-vista-border-dark">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-vista-gradient flex items-center justify-center text-white font-bold">
                  {(user.full_name || user.username || 'و').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.full_name || user.username}</p>
                <p className="text-sm text-vista-text-secondary">@{user.username}</p>
              </div>
              <button
                onClick={() => handleUnmute(user.id, user.full_name || user.username || '')}
                className="text-sm font-semibold text-vista-primary hover:text-vista-primary-dark px-3 py-1.5 rounded-xl border border-vista-primary/30"
              >
                فعال‌سازی
              </button>
            </div>
          ))}
        </div>
      )}
    </SettingsPageShell>
  )
}
