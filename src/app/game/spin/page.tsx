"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface SpinPrize { coins: number; weight: number }
interface SpinStatus { canSpin: boolean; nextAvailableMs: number; prizes: SpinPrize[] }
interface SpinResult { prizeIndex: number; coins: number; newBalance: number }

const SEGMENT_COLORS = ['#7c3aed', '#a855f7', '#6d28d9', '#c084fc', '#5b21b6', '#9333ea', '#4c1d95'];

export default function SpinWheelPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [countdown, setCountdown] = useState('');
  const spinsRef = useRef(0);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiClient.get<SpinStatus>('/v1/game/spin');
      if (data) setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Countdown to next spin when already claimed.
  useEffect(() => {
    if (!status || status.canSpin || !status.nextAvailableMs) return;
    const tick = () => {
      const diff = status.nextAvailableMs - Date.now();
      if (diff <= 0) { setCountdown(''); fetchStatus(); return; }
      const h = Math.floor(diff / 3.6e6);
      const m = Math.floor((diff % 3.6e6) / 6e4);
      const s = Math.floor((diff % 6e4) / 1000);
      setCountdown(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, fetchStatus]);

  const prizes = status?.prizes || [];
  const seg = prizes.length > 0 ? 360 / prizes.length : 0;

  const handleSpin = async () => {
    if (spinning || !status?.canSpin) return;
    setSpinning(true);
    setResult(null);
    try {
      const res = await apiClient.post<SpinResult>('/v1/game/spin');
      if (!res) throw new Error('no result');
      // Rotate so the winning segment's center lands at the top pointer.
      spinsRef.current += 6; // full turns for drama
      const target = spinsRef.current * 360 - (res.prizeIndex * seg + seg / 2);
      setRotation(target);
      setTimeout(() => {
        setResult(res);
        setSpinning(false);
        setStatus((s) => (s ? { ...s, canSpin: false, nextAvailableMs: Date.now() + 24 * 3.6e6 } : s));
        toast.success(`${res.coins.toLocaleString('fa-IR')} سکه گرفتی!`);
      }, 4200);
    } catch (e: any) {
      setSpinning(false);
      if (e?.status === 409) {
        toast.error('امروز قبلاً گردونه را چرخانده‌ای');
        fetchStatus();
      } else {
        toast.error('خطا در چرخاندن گردونه');
      }
    }
  };

  // Build conic-gradient for the wheel segments.
  const conic = prizes.length > 0
    ? `conic-gradient(${prizes.map((_, i) => `${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(', ')})`
    : '#6d28d9';

  return (
    <div className="min-h-screen bg-[#4c1d95] flex justify-center">
      <div className="w-full max-w-md bg-[#6d28d9] flex flex-col h-[100dvh] relative shadow-2xl overflow-hidden">
        <div className="flex items-center p-4 bg-[#4c1d95] sticky top-0 z-20 shadow-md">
          <button onClick={() => router.push('/game/lobby')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4">گردونه شانس روزانه</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          {loading ? (
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {/* Wheel */}
              <div className="relative w-72 h-72">
                {/* Pointer */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-yellow-400 drop-shadow-lg" />
                {/* Disc */}
                <div
                  className="w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl relative"
                  style={{
                    background: conic,
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  }}
                >
                  {prizes.map((p, i) => {
                    const angle = i * seg + seg / 2;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 origin-left flex items-center gap-1 text-white font-black text-sm drop-shadow"
                        style={{ transform: `rotate(${angle}deg) translateX(40px)` }}
                      >
                        <span style={{ transform: `rotate(${90 - angle}deg)` }} className="flex items-center gap-0.5 whitespace-nowrap">
                          {p.coins.toLocaleString('fa-IR')}
                          <span className="w-3.5 h-3.5 relative inline-block"><Image src="/images/coin.png" alt="" fill /></span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-4 border-yellow-400 shadow-lg z-10 flex items-center justify-center text-xl">🎁</div>
              </div>

              {result ? (
                <div className="text-center space-y-2 animate-in zoom-in-95">
                  <p className="text-yellow-300 font-black text-2xl drop-shadow">🎉 {result.coins.toLocaleString('fa-IR')} سکه!</p>
                  <p className="text-white/70 text-sm">موجودی جدید: {result.newBalance.toLocaleString('fa-IR')}</p>
                  <button onClick={() => router.push('/game/lobby')} className="mt-2 bg-white/15 hover:bg-white/25 text-white px-6 py-2 rounded-full font-bold border border-white/20">
                    بازگشت به تالار
                  </button>
                </div>
              ) : status?.canSpin ? (
                <button
                  onClick={handleSpin}
                  disabled={spinning}
                  className="bg-gradient-to-b from-[#87d235] to-[#73bc26] text-white font-black text-2xl px-12 py-4 rounded-2xl shadow-[0_8px_0_#5da01f] active:translate-y-[8px] active:shadow-none transition-all border-2 border-[#b5e786] disabled:opacity-60"
                >
                  {spinning ? 'در حال چرخش...' : 'بچرخان!'}
                </button>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-white font-bold">امروز چرخانده‌ای ✓</p>
                  <p className="text-white/70 text-sm">چرخش بعدی تا:</p>
                  <p className="text-yellow-300 font-black text-2xl font-mono" dir="ltr">{countdown || '...'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
