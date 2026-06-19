'use client'

import { useState, useEffect } from 'react'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { muteApi } from '@/lib/socialApi'
import { VolumeX } from 'lucide-react'
import { toast } from 'sonner'

type MutedUser = { user_id: string; username: string; full_name?: string; avatar_url?: string }

export default function MutedUsersPage() {
  const [users, setUsers] = useState<MutedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    muteApi.listMuted().then(data => {
      setUsers(data)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const handleUnmute = async (userId: string, name: string) => {
    if (!confirm(`آیا ${name} را از لیست بی‌صدا خارج می‌کنید؟`)) return
    try {
      await muteApi.unmute(userId)
      setUsers(prev => prev.filter(u => u.user_id !== userId))
      toast.success('کاربر از حالت بی‌صدا خارج شد')
    } catch {
      toast.error('خطا در خروج از حالت بی‌صدا')
    }
  }

  return (
    <SettingsPageShell title="کاربران بی‌صدا" backHref="/settings/privacy">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <VolumeX className="w-12 h-12 mx-auto mb-4 text-vista-text-secondary" />
          <p className="font-semibold">کاربر بی‌صدایی ندارید</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.user_id} className="flex items-center gap-3 p-4 bg-vista-surface dark:bg-vista-surface-dark rounded-2xl border border-vista-border dark:border-vista-border-dark">
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
                onClick={() => handleUnmute(user.user_id, user.full_name || user.username || '')}
                className="text-sm font-semibold text-vista-primary hover:text-vista-primary-dark px-3 py-1.5 rounded-xl border border-vista-primary/30"
              >
                لغو بی‌صدا
              </button>
            </div>
          ))}
        </div>
      )}
    </SettingsPageShell>
  )
}
