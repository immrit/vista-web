"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Gift, Sparkles, Star } from 'lucide-react';
import Image from 'next/image';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface SpinPrize { coins: number; weight: number }
interface SpinStatus { canSpin: boolean; freeSpinAvailable: boolean; nextAvailableMs: number; extraSpinCost: number; prizes: SpinPrize[] }
interface SpinResult { prizeIndex: number; coins: number; newBalance: number }

/* ─── Colors ─── */
const SEGMENT_PAIRS = [
  ['#8b5cf6', '#7c3aed'], // violet
  ['#f59e0b', '#d97706'], // amber
  ['#a855f7', '#9333ea'], // purple
  ['#fbbf24', '#f59e0b'], // gold
  ['#6d28d9', '#5b21b6'], // deep purple
  ['#eab308', '#ca8a04'], // yellow
  ['#c084fc', '#a855f7'], // light purple
];

/* ─── Particle system ─── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  opacity: number;
}

function useParticles(active: boolean) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const spawnAccRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      lastTimeRef.current = 0;
      spawnAccRef.current = 0;
      return;
    }
    const colors = ['#fbbf24', '#f59e0b', '#a855f7', '#ec4899', '#6ee7b7', '#f472b6', '#facc15'];
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 16.67, 3); // normalize to ~60fps
      lastTimeRef.current = time;
      spawnAccRef.current += dt;

      setParticles(prev => {
        const next = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * dt * 0.6,
            y: p.y + p.vy * dt * 0.6,
            vy: p.vy - 0.04 * dt,
            life: p.life - dt,
            opacity: Math.max(0, (p.life / p.maxLife) ** 0.7), // smooth fade curve
          }))
          .filter(p => p.life > 0);

        // spawn ~2 particles per frame at 60fps
        while (spawnAccRef.current >= 1) {
          spawnAccRef.current -= 1;
          next.push({
            id: idRef.current++,
            x: 50 + (Math.random() - 0.5) * 50,
            y: 50 + (Math.random() - 0.5) * 50,
            size: 2 + Math.random() * 3.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 1.2,
            vy: Math.random() * 1.5 + 0.5,
            life: 50 + Math.random() * 30,
            maxLife: 80,
            opacity: 1,
          });
        }
        return next.slice(-60);
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return particles;
}

/* ─── Win celebration particles ─── */
function useCelebration(active: boolean) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      lastTimeRef.current = 0;
      return;
    }
    // Burst of particles — two waves for richer feel
    const burst: Particle[] = [];
    const colors = ['#fbbf24', '#ef4444', '#a855f7', '#ec4899', '#22c55e', '#3b82f6', '#f97316', '#fde047'];
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      burst.push({
        id: idRef.current++,
        x: 50,
        y: 45,
        size: 2.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 80 + Math.random() * 60,
        maxLife: 140,
        opacity: 1,
      });
    }
    setParticles(burst);

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 16.67, 3);
      lastTimeRef.current = time;

      setParticles(prev => {
        const next = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * dt * 0.5,
            y: p.y + p.vy * dt * 0.5,
            vy: p.vy - 0.02 * dt, // gentle gravity
            vx: p.vx * (1 - 0.008 * dt), // gentle drag
            life: p.life - dt,
            opacity: Math.max(0, (p.life / p.maxLife) ** 0.5), // sqrt fade = stays visible longer
          }))
          .filter(p => p.life > 0);
        return next;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return particles;
}

/* ─── SVG Wheel Segment ─── */
function WheelSegment({ index, total, prize, colors }: { index: number; total: number; prize: SpinPrize; colors: string[] }) {
  const angle = 360 / total;
  const startAngle = index * angle - 90;
  const endAngle = startAngle + angle;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const r = 140;
  const cx = 160;
  const cy = 160;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = angle > 180 ? 1 : 0;

  const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
  const textR = r * 0.65;
  const tx = cx + textR * Math.cos(midAngle);
  const ty = cy + textR * Math.sin(midAngle);
  const textRotation = (startAngle + endAngle) / 2 + 90;

  // Inner decorative arc
  const innerR = r * 0.35;
  const ix1 = cx + innerR * Math.cos(startRad);
  const iy1 = cy + innerR * Math.sin(startRad);
  const ix2 = cx + innerR * Math.cos(endRad);
  const iy2 = cy + innerR * Math.sin(endRad);

  return (
    <g>
      {/* Main segment */}
      <path
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={`url(#seg-grad-${index})`}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`seg-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      {/* Segment separator line */}
      <line
        x1={cx}
        y1={cy}
        x2={x1}
        y2={y1}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      {/* Prize text */}
      <g transform={`translate(${tx}, ${ty}) rotate(${textRotation})`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontWeight="900"
          fontSize="14"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
        >
          {prize.coins.toLocaleString('fa-IR')}
        </text>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          y="16"
          fill="rgba(255,255,255,0.85)"
          fontWeight="700"
          fontSize="10"
        >
          سکه 🪙
        </text>
      </g>
    </g>
  );
}

/* ─── LED dots around wheel ─── */
function LEDRing({ spinning }: { spinning: boolean }) {
  const dots = 36;
  const r = 152;
  const cx = 160;
  const cy = 160;

  return (
    <>
      {Array.from({ length: dots }).map((_, i) => {
        const angle = (360 / dots) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const isEven = i % 2 === 0;

        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill={isEven ? '#fbbf24' : '#f472b6'}
            opacity={spinning ? undefined : 0.6}
            className={spinning ? (isEven ? 'animate-led-a' : 'animate-led-b') : ''}
          />
        );
      })}
    </>
  );
}

/* ─── Main Component ─── */
export default function SpinWheelPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [countdown, setCountdown] = useState('');
  const [showWin, setShowWin] = useState(false);
  const spinsRef = useRef(0);
  const wheelRef = useRef<SVGGElement>(null);

  const spinParticles = useParticles(spinning);
  const celebrationParticles = useCelebration(showWin);

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

  // Countdown to next FREE spin (not blocking paid spins)
  useEffect(() => {
    if (!status || status.freeSpinAvailable || !status.nextAvailableMs) return;
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
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setShowWin(false);
    try {
      const res = await apiClient.post<SpinResult>('/v1/game/spin');
      if (!res) throw new Error('no result');
      spinsRef.current += 10;
      const target = spinsRef.current * 360 - (res.prizeIndex * seg + seg / 2);
      setRotation(target);
      setTimeout(() => {
        setResult(res);
        setSpinning(false);
        setShowWin(true);
        // بعد از اسپین، freeSpinAvailable رو false کن
        setStatus((s) => s ? {
          ...s,
          freeSpinAvailable: false,
          nextAvailableMs: Date.now() + 24 * 3.6e6,
        } : s);
        toast.success(`${res.coins.toLocaleString('fa-IR')} سکه گرفتی! 🎉`);
      }, 6200);
    } catch (e: any) {
      setSpinning(false);
      if (e?.status === 402) {
        toast.error('سکه‌ات کافی نیست! حداقل ۳۰۰ سکه لازمه 💰');
      } else if (e?.status === 409) {
        toast.error('امروز قبلاً گردونه را چرخانده‌ای');
        fetchStatus();
      } else {
        toast.error('خطا در چرخاندن گردونه');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e0a3c] via-[#2d1060] to-[#1a0830] flex justify-center">
      <div className="w-full max-w-md flex flex-col h-[100dvh] relative shadow-2xl overflow-hidden">

        {/* Animated background stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                width: 1.5 + Math.random() * 2,
                height: 1.5 + Math.random() * 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center p-4 bg-black/30 backdrop-blur-sm sticky top-0 z-20 border-b border-white/10">
          <button onClick={() => router.push('/game')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95">
            <ArrowRight size={24} />
          </button>
          <div className="mr-4 flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400 animate-pulse" />
            <h1 className="text-white font-black text-lg bg-gradient-to-l from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              گردونه شانس روزانه
            </h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 relative z-10">
          {loading ? (
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-yellow-400 rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-400" size={20} />
            </div>
          ) : (
            <>
              {/* Particle overlay for spinning */}
              {spinning && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  {spinParticles.map(p => (
                    <div
                      key={p.id}
                      className="absolute rounded-full"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}40`,
                        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                        transform: `scale(${p.opacity})`,
                        willChange: 'transform, opacity',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Celebration overlay */}
              {showWin && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  {celebrationParticles.map(p => (
                    <div
                      key={p.id}
                      className="absolute"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        opacity: p.opacity,
                        borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '1px',
                        transform: `rotate(${(p.life * 3) % 360}deg) scale(${0.5 + p.opacity * 0.5})`,
                        boxShadow: `0 0 ${p.size * 1.5}px ${p.color}60`,
                        transition: 'opacity 0.15s ease-out',
                        willChange: 'transform, opacity',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Wheel container */}
              <div className="relative" style={{ width: 320, height: 320 }}>
                {/* Outer glow ring */}
                <div
                  className={`absolute inset-[-12px] rounded-full transition-all duration-500 ${spinning ? 'animate-glow-pulse' : ''}`}
                  style={{
                    background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(139,92,246,0.15) 50%, transparent 70%)',
                    filter: spinning ? 'blur(8px)' : 'blur(4px)',
                  }}
                />

                {/* SVG Wheel */}
                <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl">
                  {/* Outer ring */}
                  <circle cx="160" cy="160" r="155" fill="none" stroke="url(#ring-grad)" strokeWidth="6" />
                  <defs>
                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <radialGradient id="hub-grad" cx="50%" cy="40%" r="50%">
                      <stop offset="0%" stopColor="#fef3c7" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </radialGradient>
                    <filter id="wheel-shadow">
                      <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.4)" />
                    </filter>
                  </defs>

                  {/* LED dots */}
                  <LEDRing spinning={spinning} />

                  {/* Rotating group */}
                  <g
                    ref={wheelRef}
                    style={{
                      transformOrigin: '160px 160px',
                      transform: `rotate(${rotation}deg)`,
                      transition: spinning ? 'transform 6s cubic-bezier(0.12, 0.75, 0.20, 1.00)' : 'none',
                    }}
                    filter="url(#wheel-shadow)"
                  >
                    {/* Base circle */}
                    <circle cx="160" cy="160" r="140" fill="#2d1060" />

                    {/* Segments */}
                    {prizes.map((prize, i) => (
                      <WheelSegment
                        key={i}
                        index={i}
                        total={prizes.length}
                        prize={prize}
                        colors={SEGMENT_PAIRS[i % SEGMENT_PAIRS.length]}
                      />
                    ))}

                    {/* Inner decorative ring */}
                    <circle cx="160" cy="160" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                  </g>

                  {/* Center hub (stationary) */}
                  <circle cx="160" cy="160" r="28" fill="url(#hub-grad)" stroke="#fbbf24" strokeWidth="3" />
                  <circle cx="160" cy="160" r="20" fill="url(#hub-grad)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <text x="160" y="165" textAnchor="middle" dominantBaseline="middle" fontSize="22">🎁</text>

                  {/* Pointer (top) */}
                  <g filter="url(#wheel-shadow)">
                    <polygon
                      points="160,12 148,38 172,38"
                      fill="url(#pointer-grad)"
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />
                    <defs>
                      <linearGradient id="pointer-grad" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    {/* Pointer dot */}
                    <circle cx="160" cy="28" r="4" fill="#fff" opacity="0.9" />
                  </g>
                </svg>
              </div>

              {/* Result / Spin button / Countdown */}
              {result && showWin ? (
                <div className="text-center space-y-3 animate-in zoom-in-95 fade-in duration-500">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />
                    <p className="relative text-yellow-300 font-black text-3xl drop-shadow-lg flex items-center justify-center gap-2">
                      <Star className="text-yellow-400 fill-yellow-400 animate-spin-slow" size={28} />
                      {result.coins.toLocaleString('fa-IR')} سکه!
                      <Star className="text-yellow-400 fill-yellow-400 animate-spin-slow" size={28} />
                    </p>
                  </div>
                  <p className="text-white/60 text-sm">
                    موجودی جدید: <span className="text-white font-bold">{result.newBalance.toLocaleString('fa-IR')}</span>
                  </p>
                  <button
                    onClick={() => router.push('/game')}
                    className="mt-2 bg-gradient-to-l from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white px-8 py-3 rounded-2xl font-bold border border-purple-400/30 shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
                  >
                    بازگشت به تالار
                  </button>
                </div>
              ) : status ? (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className={`
                      group relative overflow-hidden
                      ${status.freeSpinAvailable
                        ? 'bg-gradient-to-b from-[#87d235] to-[#5da01f] shadow-[0_8px_0_#3d6d14,0_12px_30px_rgba(93,160,31,0.4)] hover:shadow-[0_8px_0_#3d6d14,0_16px_40px_rgba(93,160,31,0.5)] border-[#b5e786]/50'
                        : 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] shadow-[0_8px_0_#b45309,0_12px_30px_rgba(217,119,6,0.4)] hover:shadow-[0_8px_0_#b45309,0_16px_40px_rgba(217,119,6,0.5)] border-[#fde68a]/50'
                      }
                      text-white font-black text-2xl px-14 py-5
                      rounded-2xl
                      active:translate-y-[8px] active:shadow-none
                      transition-all
                      border-2
                      disabled:opacity-60 disabled:cursor-not-allowed
                      hover:scale-[1.02]
                    `}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center gap-2">
                      {spinning ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          در حال چرخش...
                        </>
                      ) : status.freeSpinAvailable ? (
                        <>
                          <Gift size={28} className="animate-bounce" />
                          بچرخان!
                        </>
                      ) : (
                        <>
                          <span className="text-lg">🪙</span>
                          {(status.extraSpinCost || 300).toLocaleString('fa-IR')} سکه بچرخان
                        </>
                      )}
                    </span>
                  </button>

                  {/* Free spin badge or next free spin countdown */}
                  {status.freeSpinAvailable ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5">
                      <span className="text-emerald-400 text-sm font-bold">✨ چرخش رایگان روزانه</span>
                    </div>
                  ) : countdown ? (
                    <div className="text-center space-y-1.5">
                      <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/20 rounded-full px-4 py-1.5">
                        <span className="text-amber-300/80 text-xs font-bold">چرخش رایگان بعدی تا: <span dir="ltr" className="font-mono text-amber-300">{countdown}</span></span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 4s ease-in-out infinite;
        }

        @keyframes led-a {
          0%, 100% { opacity: 0.9; filter: drop-shadow(0 0 3px #fbbf24); }
          50% { opacity: 0.35; filter: drop-shadow(0 0 1px #fbbf24); }
        }
        @keyframes led-b {
          0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 1px #f472b6); }
          50% { opacity: 0.9; filter: drop-shadow(0 0 3px #f472b6); }
        }
        .animate-led-a {
          animation: led-a 1.2s ease-in-out infinite;
        }
        .animate-led-b {
          animation: led-b 1.2s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }
        .animate-glow-pulse {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
