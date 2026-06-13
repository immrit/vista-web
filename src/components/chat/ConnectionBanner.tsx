'use client';

import { cn } from '@/lib/utils';
import { useChatConnectionState } from '@/hooks/useChatConnection';

interface ConnectionBannerProps {
  className?: string;
}

export function ConnectionBanner({ className }: ConnectionBannerProps) {
  const state = useChatConnectionState();

  if (state === 'connected') return null;

  return (
    <div
      className={cn(
        'px-3 py-1.5 text-center text-xs font-medium',
        state === 'connecting'
          ? 'bg-amber-500/90 text-white'
          : 'bg-red-500/90 text-white',
        className,
      )}
    >
      {state === 'connecting' ? 'در حال اتصال به پیام‌رسان...' : 'اتصال قطع شد — تلاش مجدد...'}
    </div>
  );
}
