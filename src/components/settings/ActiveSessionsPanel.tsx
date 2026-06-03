'use client';

import { useSession } from '@/hooks/useSession';
import { formatDistanceToNow } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { useAuth } from '@/hooks/useAuth';
import { Smartphone, Monitor, Trash2, MapPin, Clock, Globe } from 'lucide-react';

export default function ActiveSessionsPanel() {
  const { user, loading: authLoading } = useAuth();
  const { activeSessions, currentSession, isLoading, logoutSession } = useSession();

  const handleTerminate = async (sessionId: string) => {
    if (confirm('آیا از قطع دسترسی این نشست اطمینان دارید؟')) {
      const success = await logoutSession(sessionId);
      if (!success) {
        alert('خطا در قطع دسترسی نشست');
      }
    }
  };

  if (authLoading || isLoading)
    return (
      <div className="text-center p-8 opacity-50">در حال بارگذاری نشست‌ها...</div>
    );

  if (!user)
    return (
      <div className="text-center p-8 text-gray-500">
        برای مشاهده نشست‌ها ابتدا وارد شوید
      </div>
    );

  return (
    <div className="space-y-4" dir="rtl">
      <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
        <Monitor size={20} />
        نشست‌های فعال
      </h2>

      {activeSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg">
          هیچ نشستی یافت نشد
        </div>
      ) : (
        activeSessions.map((session) => {
          const isCurrent = currentSession?.id === session.id || session.is_current;

          // Parse device info if available, backend might return it parsed or unparsed
          const browserName = session.user_agent || session.platform || 'Unknown';
          const deviceName = 'Web Browser'; // You can improve this based on userAgent

          return (
            <div
              key={session.id}
              className={`relative p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  دستگاه فعلی
                </span>
              )}

              <div className="flex items-start justify-between gap-4">
                {/* دکمه حذف */}
                <div className="pt-2">
                  {!isCurrent && (
                    <button
                      onClick={() => handleTerminate(session.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="قطع دسترسی"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* اطلاعات متنی */}
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                    {deviceName}
                  </h3>

                  <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {session.ip_address || 'نامشخص'}
                      <Globe size={12} />
                    </span>

                    <span className="flex items-center gap-1 max-w-[200px] truncate" title={browserName}>
                      {browserName.substring(0, 30)}{browserName.length > 30 ? '...' : ''}
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-1"></span>
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-3 text-[11px] text-gray-400 dark:text-gray-500">
                    {session.last_activity && (
                      <span
                        className="flex items-center gap-1"
                        title={new Date(session.last_activity).toLocaleString('fa-IR')}
                      >
                        {formatDistanceToNow(new Date(session.last_activity), {
                          addSuffix: true,
                          locale: faIR,
                        })}
                        <Clock size={12} />
                      </span>
                    )}

                    {(session.location_city || session.location_country) && (
                      <span className="flex items-center gap-1 text-blue-600/70 dark:text-blue-400/70">
                        {session.location_city}، {session.location_country}
                        <MapPin size={12} />
                      </span>
                    )}
                  </div>
                </div>

                {/* آیکون اصلی */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {browserName.toLowerCase().includes('mobile') || browserName.toLowerCase().includes('android') || browserName.toLowerCase().includes('ios') ? (
                    <Smartphone size={24} />
                  ) : (
                    <Monitor size={24} />
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
