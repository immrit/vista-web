"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Gift } from 'lucide-react';
import Image from 'next/image';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface Mission {
  key: string;
  title: string;
  target: number;
  reward: number;
  progress: number;
  claimed: boolean;
  claimable: boolean;
}

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    try {
      const data = await apiClient.get<{ missions: Mission[] }>('/v1/game/missions');
      setMissions(data?.missions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const claim = async (key: string) => {
    if (claiming) return;
    setClaiming(key);
    try {
      const res = await apiClient.post<{ reward: number }>('/v1/game/missions/claim', { key });
      toast.success(`${(res?.reward || 0).toLocaleString('fa-IR')} سکه گرفتی!`);
      fetchMissions();
    } catch (e: any) {
      toast.error(e?.status === 409 ? 'هنوز کامل نشده یا قبلاً گرفته‌ای' : 'خطا در دریافت جایزه');
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#4c1d95] flex justify-center">
      <div className="w-full max-w-md bg-[#6d28d9] flex flex-col h-[100dvh] relative shadow-2xl">
        <div className="flex items-center p-4 bg-[#4c1d95] sticky top-0 z-20 shadow-md">
          <button onClick={() => router.push('/game')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4">مأموریت‌های روزانه</h1>
        </div>

        <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center text-white">
            <Gift size={28} className="mx-auto mb-2 text-yellow-300" />
            <p className="text-sm font-bold opacity-90">هر روز مأموریت‌ها را کامل کن و سکه رایگان بگیر! نیمه‌شب ریست می‌شود.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            missions.map((m) => {
              const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
              return (
                <div key={m.key} className="bg-white rounded-2xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-slate-800 text-sm">{m.title}</span>
                    <div className="flex items-center gap-1 text-[#b45309] font-bold text-sm">
                      +{m.reward.toLocaleString('fa-IR')}
                      <div className="relative w-4 h-4"><Image src="/images/coin.png" alt="coin" fill /></div>
                    </div>
                  </div>

                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-l from-[#87d235] to-[#73bc26] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      {m.progress.toLocaleString('fa-IR')} / {m.target.toLocaleString('fa-IR')}
                    </span>
                    {m.claimed ? (
                      <span className="flex items-center gap-1 text-[#73bc26] font-bold text-xs">
                        <CheckCircle2 size={16} /> دریافت شد
                      </span>
                    ) : m.claimable ? (
                      <button
                        onClick={() => claim(m.key)}
                        disabled={claiming === m.key}
                        className="bg-[#78c02c] text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-[0_3px_0_#5da01f] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50"
                      >
                        {claiming === m.key ? '...' : 'دریافت جایزه'}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-300">در حال انجام</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
