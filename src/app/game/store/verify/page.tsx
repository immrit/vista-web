"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [coinsAdded, setCoinsAdded] = useState(0);

  useEffect(() => {
    const trackId = searchParams.get('trackId');
    const success = searchParams.get('success');

    if (!trackId || success === '0') {
      setStatus('error');
      setMessage('پرداخت توسط شما لغو شد یا ناموفق بود.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await apiClient.post<{ success: boolean, message: string, coins: number }>('/v1/payment/zibal/verify', {
          track_id: parseInt(trackId, 10)
        });
        
        if (res.data?.success) {
          setStatus('success');
          setMessage(res.data.message);
          setCoinsAdded(res.data.coins);
        } else {
          setStatus('error');
          setMessage('خطا در تایید پرداخت.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error?.message || 'خطا در ارتباط با سرور.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="p-4 flex-1 flex flex-col items-center justify-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center text-white">
          <Loader2 size={48} className="animate-spin mb-4" />
          <h2 className="text-xl font-bold">در حال بررسی پرداخت...</h2>
          <p className="opacity-80 mt-2 text-sm">لطفا شکیبا باشید</p>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl w-full max-w-sm animate-in zoom-in-95">
          <CheckCircle2 size={80} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">پرداخت موفق!</h2>
          <p className="text-slate-600 font-bold mb-6">{message}</p>
          <button
            onClick={() => router.push('/game')}
            className="w-full bg-[#78c02c] hover:bg-[#68a825] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_0_#5da01f] active:translate-y-1 active:shadow-none transition-all"
          >
            بازگشت به بازی
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl w-full max-w-sm animate-in zoom-in-95">
          <XCircle size={80} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">پرداخت ناموفق!</h2>
          <p className="text-slate-600 font-bold mb-6">{message}</p>
          <button
            onClick={() => router.push('/game/store')}
            className="w-full bg-[#1b73b5] hover:bg-[#155a8f] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_0_#114b82] active:translate-y-1 active:shadow-none transition-all"
          >
            تلاش مجدد
          </button>
          <button
            onClick={() => router.push('/game')}
            className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all"
          >
            بازگشت به خانه
          </button>
        </div>
      )}
    </div>
  );
}

export default function GameStoreVerifyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#114b82] flex justify-center overflow-hidden">
      <div className="w-full max-w-md bg-[#1b73b5] flex flex-col h-[100dvh] relative shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center p-4 bg-[#1b73b5] sticky top-0 z-20 shadow-md">
          <button 
            onClick={() => router.push('/game/store')}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4 flex items-center">
            نتیجه پرداخت
          </h1>
        </div>

        <Suspense fallback={<div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-white w-10 h-10" /></div>}>
          <VerifyContent />
        </Suspense>

      </div>
    </div>
  );
}
