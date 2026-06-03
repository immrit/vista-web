'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Wifi,
  LogOut,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { ActiveSession } from '@/lib/types/session';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

function getDeviceIcon(session: ActiveSession) {
  const device = session.device_info?.device?.toLowerCase() || 'desktop';

  if (device.includes('mobile')) return Smartphone;
  if (device.includes('tablet')) return Tablet;
  return Monitor;
}

export function SessionManagement() {
  const { currentSession, activeSessions, isLoading, logoutSession, logoutOtherSessions } =
    useSession();
  const [isLoggingOut, setIsLoggingOut] = useState<string | null>(null);

  const handleLogout = async (sessionId: string) => {
    setIsLoggingOut(sessionId);
    try {
      await logoutSession(sessionId);
    } finally {
      setIsLoggingOut(null);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOut('all');
    try {
      await logoutOtherSessions();
    } finally {
      setIsLoggingOut(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            نشست‌های فعال
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {activeSessions.length} نشست فعال
          </p>
        </div>

        {activeSessions.length > 1 && (
          <Button
            onClick={handleLogoutAll}
            disabled={isLoggingOut === 'all'}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 ml-2" />
            خروج از همه
          </Button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {activeSessions.map((session) => {
          const isCurrent = session.id === currentSession?.id;
          const DeviceIcon = getDeviceIcon(session);

          return (
            <div
              key={session.id}
              className={`bg-white dark:bg-zinc-800 rounded-xl border p-4 ${
                isCurrent
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              {/* Current Badge */}
              {isCurrent && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">نشست فعلی</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Device Icon */}
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DeviceIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    {/* Device & Browser */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {session.device_info?.browser || 'مرورگر ناشناس'}
                      </h4>
                    </div>

                    {/* OS */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {session.device_info?.os || 'سیستم‌عامل ناشناس'}
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {/* IP Address */}
                      {session.ip_address && (
                        <div className="flex items-center gap-1">
                          <Wifi className="w-3 h-3" />
                          <span>{session.ip_address}</span>
                        </div>
                      )}

                      {/* Location */}
                      {(session.location_city || session.location_country) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {session.location_city
                              ? `${session.location_city}, ${session.location_country}`
                              : session.location_country}
                          </span>
                        </div>
                      )}

                      {/* Last Activity */}
                      <div className="flex items-center gap-1 col-span-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          آخرین فعالیت:{' '}
                          {formatDistanceToNow(new Date(session.last_activity), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                {!isCurrent && (
                  <Button
                    onClick={() => handleLogout(session.id)}
                    disabled={isLoggingOut === session.id}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">نکته امنیتی</p>
            <p>
              اگر دستگاهی را که نمی‌شناسید در لیست می‌بینید، بلافاصله از آن خارج شوید و
              رمز عبور خود را تغییر دهید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



