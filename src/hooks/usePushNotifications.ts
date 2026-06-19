'use client';

import { useState, useEffect, useCallback } from 'react';
import { setupPushNotifications, unsubscribeFromPush } from '@/lib/webPush';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => setSubscribed(Boolean(sub)))
      );
    }
  }, []);

  const enable = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await setupPushNotifications();
      if (ok) {
        setPermission('granted');
        setSubscribed(true);
        toast.success('اعلان‌های فشاری فعال شد');
      } else {
        toast.error('اجازه اعلان داده نشد');
      }
    } catch {
      toast.error('خطا در فعال‌سازی اعلان‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      toast.success('اعلان‌های فشاری غیرفعال شد');
    } catch {
      toast.error('خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

  return { permission, subscribed, loading, enable, disable, isSupported };
}
