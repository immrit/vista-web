'use client';

import { Loader2, MapPin } from 'lucide-react';

interface LocationPermissionScreenProps {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'sending';
  onRequest: () => void;
  onSkip: () => void;
}

export function LocationPermissionScreen({ status, onRequest, onSkip }: LocationPermissionScreenProps) {
  const isLoading = status === 'requesting' || status === 'sending';
  const Icon = MapPin;
  const message = status === 'denied' 
    ? 'برای پیدا کردن آدم‌های نزدیک، به دسترسی موقعیت مکانی نیاز داریم' 
    : 'برای پیدا کردن آدم‌های نزدیک، به دسترسی موقعیت مکانی نیاز داریم';
  const actionLabel = status === 'denied' ? 'تلاش مجدد' : 'تلاش مجدد';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-8 text-center">
      <Icon className="w-16 h-16 text-vista-primary/70 mb-5" />
      <p className="text-vista-text-secondary dark:text-vista-text-secondary-dark text-base leading-relaxed mb-6">
        {message}
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRequest}
          disabled={isLoading}
          className="bg-vista-primary text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{actionLabel}</span>
        </button>

        {status === 'denied' && (
          <button
            onClick={onSkip}
            className="text-vista-primary text-sm font-semibold mt-2"
          >
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}
