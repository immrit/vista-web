"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingCart, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import Image from 'next/image';

const PACKAGES = [
  { id: 'coins_1000', coins: 1000, price: 10000, bonus: 0, image: '/images/coin.png' },
  { id: 'coins_5000', coins: 5000, price: 45000, bonus: 500, image: '/images/coin.png' },
  { id: 'coins_12000', coins: 12000, price: 90000, bonus: 2000, image: '/images/coin.png' },
];

export default function GameStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(packageId);
      const res = await apiClient.post<{ trackId: number, url: string }>('/v1/payment/zibal/request', {
        package_id: packageId,
        callback_url: `${window.location.origin}/game/store/verify`
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در اتصال به درگاه پرداخت. لطفا دوباره تلاش کنید.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#114b82] flex justify-center overflow-hidden">
      <div className="w-full max-w-md bg-[#1b73b5] flex flex-col h-[100dvh] relative shadow-2xl overflow-y-auto pb-8">
        
        {/* Header */}
        <div className="flex items-center p-4 bg-[#1b73b5] sticky top-0 z-20 shadow-md">
          <button 
            onClick={() => router.push('/game')}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4 flex items-center">
            <ShoppingCart size={20} className="ml-2" /> فروشگاه سکه
          </h1>
        </div>

        <div className="p-4 flex-1">
          <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-2xl p-6 mb-6 text-center text-white shadow-lg border border-yellow-300">
            <div className="w-20 h-20 mx-auto relative mb-2">
               <Image src="/images/coin.png" alt="Big Coin" fill className="object-contain drop-shadow-md" />
            </div>
            <h2 className="font-black text-2xl mb-1 drop-shadow-md">خزانه ویستا</h2>
            <p className="text-sm font-bold opacity-90">با خرید سکه، در رقابت‌ها سریع‌تر پیشرفت کنید!</p>
          </div>

          <div className="space-y-4">
            {PACKAGES.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-2xl p-1 shadow-[0_4px_0_rgba(0,0,0,0.1)] relative overflow-hidden flex items-stretch">
                {pkg.bonus > 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg z-10">
                    {pkg.bonus.toLocaleString('fa-IR')} سکه هدیه!
                  </div>
                )}
                
                <div className="w-24 bg-slate-50 flex items-center justify-center rounded-r-xl border-l border-slate-100 p-2 relative">
                   <div className="w-12 h-12 relative">
                     <Image src={pkg.image} alt="coins" fill className="object-contain drop-shadow-sm" />
                   </div>
                </div>

                <div className="flex-1 p-4 flex flex-col justify-center">
                  <div className="font-black text-xl text-slate-800 flex items-center space-x-1 space-x-reverse">
                    <span>{pkg.coins.toLocaleString('fa-IR')}</span>
                    <span className="text-sm text-slate-500">سکه</span>
                  </div>
                  <div className="text-[#78c02c] font-bold text-lg mt-1">
                    {pkg.price.toLocaleString('fa-IR')} <span className="text-xs">تومان</span>
                  </div>
                </div>

                <div className="p-3 flex items-center">
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading !== null}
                    className="bg-[#78c02c] hover:bg-[#68a825] disabled:bg-slate-300 disabled:shadow-none text-white font-bold px-4 py-3 rounded-xl shadow-[0_4px_0_#5da01f] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center min-w-[80px]"
                  >
                    {loading === pkg.id ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>خرید</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center text-white/50 text-xs font-bold space-x-1 space-x-reverse">
            <ShieldCheck size={16} />
            <span>پرداخت امن با درگاه زیبال</span>
          </div>
        </div>
      </div>
    </div>
  );
}
