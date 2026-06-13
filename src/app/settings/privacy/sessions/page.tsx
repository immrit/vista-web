'use client'

import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { useSession } from '@/hooks/useSession'
import { Monitor, Smartphone, Trash2, Wifi } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'
import { toast } from 'sonner'

export default function SessionsPage() {
  const { activeSessions, currentSession, isLoading, logoutSession, logoutOtherSessions, fetchSessions } = useSession()

  const handleTerminate = async (id: string) => {
    if (!confirm('آیا از قطع این نشست اطمینان دارید؟')) return
    const ok = await logoutSession(id)
    if (ok) toast.success('نشست قطع شد')
    else toast.error('خطا در قطع نشست')
  }

  const handleTerminateAll = async () => {
    if (!confirm('همه نشست‌های دیگر قطع شوند؟')) return
    const ok = await logoutOtherSessions()
    if (ok) toast.success('نشست‌های دیگر قطع شدند')
    else toast.error('خطا')
  }

  return (
    <SettingsPageShell title="نشست‌های فعال" backHref="/settings/privacy">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {currentSession && (
            <div className="p-5 rounded-2xl bg-vista-primary/10 border border-vista-primary/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-vista-gradient flex items-center justify-center">
                  <Monitor className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold">این دستگاه</p>
                  <p className="text-sm text-vista-success flex items-center gap-1 mt-0.5">
                    <Wifi className="w-3.5 h-3.5" /> آنلاین
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSessions.filter(s => !s.is_current && s.id !== currentSession?.id).length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-vista-text-secondary">سایر دستگاه‌ها</h3>
                <button onClick={handleTerminateAll} className="text-sm text-vista-error font-medium">
                  قطع همه
                </button>
              </div>

              <div className="space-y-2">
                {activeSessions.filter(s => !s.is_current).map(session => (
                  <div key={session.id} className="flex items-center gap-3 p-4 bg-vista-surface dark:bg-vista-surface-dark rounded-2xl border border-vista-border dark:border-vista-border-dark">
                    <Smartphone className="w-10 h-10 p-2 rounded-xl bg-vista-surface-variant dark:bg-vista-surface-variant-dark text-vista-text-secondary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.platform || session.user_agent || 'دستگاه ناشناس'}</p>
                      {session.last_activity && (
                        <p className="text-xs text-vista-text-secondary">
                          {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true, locale: faIR })}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleTerminate(session.id)} className="p-2 text-vista-error hover:bg-vista-error/10 rounded-full">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <button onClick={fetchSessions} className="w-full py-3 text-sm text-vista-primary font-medium">
            به‌روزرسانی
          </button>
        </div>
      )}
    </SettingsPageShell>
  )
}
