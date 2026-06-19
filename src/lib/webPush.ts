'use client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } catch {
    return null;
  }
}

export async function sendSubscriptionToBackend(sub: PushSubscription): Promise<void> {
  await fetch('/api/backend/v1/me/push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(sub.toJSON()),
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await fetch('/api/backend/v1/me/push-subscription', {
        method: 'DELETE',
        credentials: 'include',
      });
    }
  } catch {
    // silent
  }
}

export async function setupPushNotifications(): Promise<boolean> {
  const granted = await requestPushPermission();
  if (!granted) return false;
  const sub = await subscribeToPush();
  if (!sub) return false;
  await sendSubscriptionToBackend(sub);
  return true;
}

export async function updateBadgeCount(count: number): Promise<void> {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      await (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> }).setAppBadge(count);
    } else {
      await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
    }
  }
}
