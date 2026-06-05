"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, Trophy, Users, Zap, Swords, Coins, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

export default function GameHomePage() {
  const router = useRouter();
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [coins, setCoins] = useState<number | null>(null);
  const [duelInviteCode, setDuelInviteCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const { profile } = useAuth();

  React.useEffect(() => {
    if (profile) {
      apiClient.get<{coins: number}>('/v1/game/coins').then(data => {
        if (data) setCoins(data.coins);
      }).catch(console.error);
    }
  }, [profile]);

  const handleStartGame = async () => {
    if (!profile) {
      router.push('/auth');
      return;
    }
    if (coins !== null && coins < 50) {
      alert('موجودی سکه شما کافی نیست! برای ورود به مسابقه حداقل ۵۰ سکه نیاز دارید.');
      return;
    }
    setIsMatchmaking(true);
    
    try {
      const data = await apiClient.post<{ status: string; matchId: string | null }>('/v1/game/matchmake', {
        name: profile.full_name || profile.username || 'بازیکن',
        avatarUrl: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.id,
      });
      
      if (data.matchId) {
        // Match found immediately
        router.push(`/game/play/${data.matchId}`);
      } else if (data.status === 'waiting') {
        // Start polling for active match
        const pollInterval = setInterval(async () => {
          try {
            const checkData = await apiClient.get<{ matchId: string | null }>('/v1/game/active-match');
            if (checkData.matchId) {
              clearInterval(pollInterval);
              router.push(`/game/play/${checkData.matchId}`);
            }
          } catch (e) {
            console.error('Polling error:', e);
          }
        }, 2000);
        
        // Clear interval on unmount
        return () => clearInterval(pollInterval);
      }
    } catch (error) {
      console.error(error);
      setIsMatchmaking(false);
      alert('خطا در ورود به مسابقه: ' + (error as any).message);
    }
  };

  const handleCreateDuel = async () => {
    if (!profile) return router.push('/auth');
    if (coins !== null && coins < 50) return alert('موجودی سکه شما کافی نیست! (۵۰ سکه)');
    try {
      setIsMatchmaking(true);
      const data = await apiClient.post<{ matchId: string }>('/v1/game/duel/create', {
        name: profile.full_name || profile.username || 'بازیکن',
        avatarUrl: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.id,
      });
      if (data && data.matchId) {
        setDuelInviteCode(data.matchId);
        if (coins !== null) setCoins(coins - 50);
      }
    } catch (e: any) {
      alert('خطا: ' + e.message);
    } finally {
      setIsMatchmaking(false);
    }
  };

  const handleJoinDuel = async () => {
    if (!profile) return router.push('/auth');
    if (!joinCodeInput.trim()) return alert('لطفا کد مسابقه را وارد کنید.');
    if (coins !== null && coins < 50) return alert('موجودی سکه شما کافی نیست! (۵۰ سکه)');
    try {
      setIsMatchmaking(true);
      const data = await apiClient.post<{ matchId: string }>('/v1/game/duel/join', {
        matchId: joinCodeInput.trim(),
        name: profile.full_name || profile.username || 'بازیکن',
        avatarUrl: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.id,
      });
      if (data && data.matchId) {
        router.push(`/game/play/${data.matchId}`);
      }
    } catch (e: any) {
      alert('خطا: ' + e.message);
      setIsMatchmaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-pink-50 to-indigo-100 dark:from-indigo-950 dark:via-purple-900 dark:to-slate-900 p-6 md:p-12 flex flex-col items-center justify-center font-sans">
      <div className="max-w-4xl w-full flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center space-y-4 animate-wobble">
          <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-pink-400 to-purple-500 rounded-[2rem] shadow-[0_8px_0_0_#9333ea] mb-4 text-white transform rotate-3">
            <Gamepad2 size={56} strokeWidth={2} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-md">
            ویستا <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600 filter drop-shadow-sm">کوئیز</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-xl mx-auto font-bold bg-white/40 dark:bg-slate-900/40 py-2 px-4 rounded-full backdrop-blur-sm border border-white/50 dark:border-slate-800/50">
            اطلاعات عمومی خود را به چالش بکشید و با دوستان خود به صورت آنلاین رقابت کنید!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border-b-4 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3 hover:-translate-y-1 transition-transform">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full"><Zap className="text-amber-500" size={32} /></div>
            <h3 className="font-black text-xl dark:text-white">سرعت و دقت</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">هرچه سریع‌تر جواب دهید، امتیاز بیشتری می‌گیرید.</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border-b-4 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3 hover:-translate-y-1 transition-transform">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full"><Users className="text-blue-500" size={32} /></div>
            <h3 className="font-black text-xl dark:text-white">رقابت دونفره</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">در ۶ راند نفس‌گیر با حریف خود مبارزه کنید.</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border-b-4 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3 hover:-translate-y-1 transition-transform">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full"><Trophy className="text-emerald-500" size={32} /></div>
            <h3 className="font-black text-xl dark:text-white">جدول امتیازات</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">امتیاز جمع کنید و در صدر جدول ویستا قرار بگیرید.</p>
          </div>
        </div>

        <div className="flex flex-col items-center w-full max-w-lg space-y-4">
          <button
            onClick={handleStartGame}
            disabled={isMatchmaking}
            className={cn(
              "w-full relative overflow-hidden px-12 py-6 rounded-[2rem] text-2xl font-black text-white transition-all duration-200 transform flex items-center justify-center space-x-3 space-x-reverse",
              isMatchmaking 
                ? "bg-slate-400 border-b-4 border-slate-500 translate-y-1" 
                : "bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 border-b-[6px] border-emerald-700 active:border-b-0 active:translate-y-[6px] shadow-lg"
            )}
          >
            {isMatchmaking ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال اتصال...</span>
              </>
            ) : (
              <>
                <Gamepad2 size={32} className="animate-wobble" />
                <span className="drop-shadow-md">شروع مسابقه عمومی</span>
                <div className="bg-black/20 px-3 py-1 rounded-full text-base flex items-center space-x-1 space-x-reverse ml-auto shadow-inner">
                  <span>۵۰-</span>
                  <div className="relative w-5 h-5"><Image src="/images/coin.png" alt="coin" fill/></div>
                </div>
              </>
            )}
          </button>

          {/* Duels Section */}
          <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b-4 border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 space-y-6 mt-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400"></div>
            
            <div className="flex items-center space-x-3 space-x-reverse text-indigo-600 dark:text-indigo-400 font-black text-2xl border-b-2 border-slate-100 dark:border-slate-800/50 pb-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl"><Swords size={28} /></div>
              <span>بازی با دوستان (دوئل)</span>
            </div>

            {duelInviteCode ? (
              <div className="space-y-4 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-800/50 text-center animate-pop">
                <p className="text-base text-indigo-800 dark:text-indigo-300 font-bold">مسابقه ساخته شد! کد زیر را به دوستتان بدهید:</p>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-center font-mono text-2xl select-all font-black text-indigo-600 dark:text-indigo-400 shadow-inner border-2 border-slate-100 dark:border-slate-700">
                  {duelInviteCode}
                </div>
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm font-bold text-amber-600 animate-pulse mt-4">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>منتظر ورود حریف...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={handleCreateDuel}
                  disabled={isMatchmaking}
                  className="bg-gradient-to-b from-indigo-400 to-indigo-500 hover:from-indigo-300 hover:to-indigo-400 text-white border-b-[6px] border-indigo-700 active:border-b-0 active:translate-y-[6px] py-4 rounded-[2rem] font-black flex flex-col items-center justify-center transition-all duration-200 shadow-md"
                >
                  <span className="text-xl drop-shadow-sm">ساخت مسابقه جدید</span>
                  <span className="text-sm bg-black/20 px-3 py-1 rounded-full mt-2 flex items-center shadow-inner">هزینه: ۵۰ <div className="relative w-4 h-4 mx-1"><Image src="/images/coin.png" alt="coin" fill/></div></span>
                </button>
                <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
                  <input 
                    type="text" 
                    placeholder="کد مسابقه را وارد کنید..."
                    value={joinCodeInput}
                    onChange={e => setJoinCodeInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 font-bold text-center focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all shadow-inner"
                    dir="ltr"
                  />
                  <button 
                    onClick={handleJoinDuel}
                    disabled={isMatchmaking || !joinCodeInput.trim()}
                    className="w-full bg-gradient-to-b from-pink-500 to-rose-500 text-white hover:from-pink-400 hover:to-rose-400 py-3 rounded-2xl font-black text-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 border-b-4 border-rose-700 active:border-b-0 active:translate-y-1"
                  >
                    <LinkIcon size={20} />
                    <span className="drop-shadow-sm">ورود به بازی</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
