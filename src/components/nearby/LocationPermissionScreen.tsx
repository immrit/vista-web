'use client';

import { MapPin, Users, Loader2, AlertCircle } from 'lucide-react';

interface LocationPermissionScreenProps {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'sending';
  onRequest: () => void;
  onSkip: () => void;
}

export function LocationPermissionScreen({ status, onRequest, onSkip }: LocationPermissionScreenProps) {
  const isLoading = status === 'requesting' || status === 'sending';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8 text-center">
      <div className="w-24 h-24 rounded-full bg-vista-gradient flex items-center justify-center mb-6 shadow-xl shadow-vista-primary/30">
        <MapPin className="w-12 h-12 text-white" />
      </div>

      <h1 className="text-2xl font-black mb-3">اطراف من</h1>
      <p className="text-vista-text-secondary dark:text-vista-text-secondary-dark text-base leading-relaxed max-w-sm mb-8">
        برای دیدن کاربران نزدیک به شما، نیاز به دسترسی به موقعیت مکانی داریم.
        اطلاعات مکانی شما فقط برای فیلتر کردن فاصله استفاده می‌شود.
      </p>

      {status === 'denied' && (
        <div className="flex items-center gap-2 text-vista-error bg-vista-error/10 px-4 py-3 rounded-2xl mb-6 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>دسترسی رد شد. لطفاً از تنظیمات مرورگر اجازه دهید.</span>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onRequest}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-vista-gradient text-white font-bold py-4 rounded-2xl shadow-lg shadow-vista-primary/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{status === 'sending' ? 'در حال ارسال...' : 'در حال درخواست...'}</span>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              <span>اشتراک موقعیت مکانی</span>
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 text-vista-text-secondary dark:text-vista-text-secondary-dark py-3 rounded-2xl hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors"
        >
          <Users className="w-5 h-5" />
          <span>مشاهده کاربران آنلاین (بدون فاصله)</span>
        </button>
      </div>
    </div>
  );
}
