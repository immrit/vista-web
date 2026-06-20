"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Home, Settings, Users, Crown, UserCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { ActiveMatchCard } from '@/components/game/ActiveMatchCard';
import { MatchState } from '@/lib/game/types';
import { getAuthPlayerCandidates, resolveMatchPlayerId } from '@/lib/game/player';

type Tab = 'home' | 'leaderboard';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string;
  coins: number;
}

export default function GameHomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [coins, setCoins] = useState<number | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [activeMatches, setActiveMatches] = useState<MatchState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const { user, profile, loading } = useAuth();
  const currentUser = user || profile;
  const currentUserId = currentUser?.id;
  const playerIdCandidates = getAuthPlayerCandidates(user?.id, profile?.id, profile?.user_id);
  const [gameDisplayName, setGameDisplayName] = useState<string | null>(null);
  const [gameAvatarUrl, setGameAvatarUrl] = useState<string | null>(null);

  const displayName = gameDisplayName || profile?.full_name || profile?.username || user?.full_name || user?.username || 'بازیکن';
  const avatarUrl = gameAvatarUrl || profile?.avatar_url || user?.avatar_url || (currentUserId ? `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUserId}` : '');

  const fetchStats = useCallback(async () => {
    if (!currentUserId) { setCoins(null); return; }
    const data = await apiClient.get<{ coins: number; xp: number; level: number; displayName: string | null; avatarUrl: string | null }>('/v1/game/profile');
    if (data) {
      setCoins(data.coins);
      setXp(data.xp);
      setLevel(data.level);
      setGameDisplayName(data.displayName);
      setGameAvatarUrl(data.avatarUrl);
    }
  }, [currentUserId]);

  const fetchActiveMatches = useCallback(async () => {
    if (!currentUserId) { setActiveMatches([]); return; }
    const data = await apiClient.get<{ matches: MatchState[] }>('/v1/game/active-matches');
    setActiveMatches(data?.matches || []);
  }, [currentUserId]);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const data = await apiClient.get<{ leaderboard: LeaderboardEntry[] }>('/v1/game/leaderboard');
      setLeaderboard(data?.leaderboard || []);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats().catch(console.error); }, [fetchStats]);

  useEffect(() => {
    fetchActiveMatches().catch(console.error);
    const interval = setInterval(() => { fetchActiveMatches().catch(console.error); }, 5000);
    return () => clearInterval(interval);
  }, [fetchActiveMatches]);

  useEffect(() => {
    if (!loading && !currentUserId) router.push('/auth');
  }, [loading, currentUserId, router]);

  useEffect(() => {
    if (tab === 'leaderboard') fetchLeaderboard();
  }, [tab, fetchLeaderboard]);

  const hasWaitingMatch = activeMatches.some((match) => {
    const matchPlayerId = resolveMatchPlayerId(match, playerIdCandidates);
    return match.player1.id === matchPlayerId && !match.player2 && (match.status === 'waiting' || match.status === 'waiting_for_opponent');
  });
  const isReady = !loading && !!currentUserId && coins !== null;
  const hasEnoughCoins = coins !== null && (coins >= 50 || hasWaitingMatch);
  const isAtCapacity = activeMatches.length >= 5 && !hasWaitingMatch;
  const startDisabled = !isReady || isMatchmaking || isAtCapacity || !hasEnoughCoins;

  const handleStartGame = async () => {
    if (loading || !currentUserId || coins === null) return;
    if (coins < 50 && !hasWaitingMatch) {
      alert('موجودی سکه شما کافی نیست! برای ورود به مسابقه حداقل ۵۰ سکه نیاز دارید.');
      return;
    }
    try {
      setIsMatchmaking(true);
      const data = await apiClient.post<{ matchId: string; status: string }>('/v1/game/matchmake', {
        name: displayName,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUserId}`,
      });
      if (!data?.matchId) throw new Error('matchId دریافت نشد');
      await Promise.all([fetchStats().catch(console.error), fetchActiveMatches().catch(console.error)]);
      router.push(`/game/match/${data.matchId}`);
    } catch (error) {
      console.error(error);
      setIsMatchmaking(false);
      alert('خطا در ورود به مسابقه: ' + ((error as any).message || 'نامشخص'));
    }
  };

  const xpForLevel = (lvl: number) => Math.pow(lvl, 2) * 100;
  const xpForPrevLevel = (lvl: number) => Math.pow(Math.max(0, lvl - 1), 2) * 100;
  const xpRange = xpForLevel(level) - xpForPrevLevel(level);
  const xpProgress = xpRange > 0 ? Math.min(100, Math.max(0, ((xp - xpForPrevLevel(level)) / xpRange) * 100)) : 0;

  if (loading || !currentUserId) {
    return (
      <div className="min-h-screen bg-[#0d0c1e] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0c1e] pb-20 font-sans relative overflow-x-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-violet-950/60 to-transparent pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-50 px-4 py-3 flex items-center gap-3 sticky top-0 bg-[#0d0c1e]/85 backdrop-blur-md border-b border-white/5">
        {/* Level badge */}
        <div className="bg-violet-950/80 border border-violet-700/40 rounded-lg px-2.5 py-1.5 text-violet-300 font-black text-xs flex-shrink-0">
          {level}
        </div>
        {/* XP bar */}
        <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <span className="text-white/30 text-[10px] font-bold whitespace-nowrap flex-shrink-0">
          {xp.toLocaleString('fa-IR')} XP
        </span>
        {/* Coins */}
        <button
          onClick={() => router.push('/game/store')}
          className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5 hover:bg-amber-500/20 transition-all flex-shrink-0"
        >
          <div className="w-4 h-4 relative"><Image src="/images/coin.png" alt="coin" fill /></div>
          <span className="font-black text-sm text-amber-300">{coins !== null ? coins.toLocaleString('fa-IR') : '...'}</span>
          <span className="text-amber-500/50 font-bold text-[10px]">+</span>
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 relative z-10">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('home')}
            className={cn('flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5',
              tab === 'home'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Home size={14} /> خانه
          </button>
          <button
            onClick={() => setTab('leaderboard')}
            className={cn('flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5',
              tab === 'leaderboard'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Trophy size={14} /> جدول برترین‌ها
          </button>
        </div>

        {tab === 'home' && (
          <div className="space-y-3">
            {/* Profile card */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-violet-500/40">
                  <Avatar src={avatarUrl} alt="Avatar" className="w-full h-full" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-violet-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-violet-500/30">
                  Lvl {level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-black text-base truncate">{displayName}</h2>
                <p className="text-white/30 text-xs font-bold mt-0.5">بازیکن ویستا کوییز</p>
              </div>
              <button
                onClick={() => router.push('/game/profile')}
                className="w-9 h-9 flex items-center justify-center text-white/20 hover:text-violet-400 transition-colors rounded-xl hover:bg-violet-500/10"
              >
                <UserCircle size={20} />
              </button>
            </div>

            {/* Start game button */}
            <button
              onClick={handleStartGame}
              disabled={startDisabled}
              className={cn(
                'w-full rounded-2xl p-5 flex items-center justify-between transition-all border',
                startDisabled
                  ? 'bg-white/5 border-white/8 cursor-not-allowed'
                  : 'bg-violet-600 border-violet-500/50 hover:bg-violet-500 shadow-xl shadow-violet-500/25 active:scale-[0.98]'
              )}
            >
              <div>
                <div className="text-white font-black text-xl">
                  {!isReady ? 'بارگذاری...'
                    : isMatchmaking ? 'در حال اتصال...'
                    : isAtCapacity ? 'ظرفیت پر است'
                    : !hasEnoughCoins ? 'سکه کافی نیست'
                    : hasWaitingMatch ? 'ادامه انتظار'
                    : 'شروع بازی جدید'}
                </div>
                {!startDisabled && (
                  <div className="text-white/50 text-xs mt-0.5 font-bold">
                    {hasWaitingMatch ? 'در صف انتظار هستید' : 'هزینه ورود: ۵۰ سکه'}
                  </div>
                )}
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', startDisabled ? 'bg-white/5' : 'bg-white/15')}>
                {isMatchmaking
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Zap size={24} className={startDisabled ? 'text-white/20' : 'text-white'} fill={startDisabled ? 'none' : 'white'} />
                }
              </div>
            </button>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/game/lobby')}
                className="bg-white/5 border border-white/8 hover:border-cyan-500/30 hover:bg-cyan-500/5 rounded-2xl p-4 flex flex-col gap-2 text-white transition-all active:scale-95"
              >
                <div className="w-9 h-9 bg-cyan-500/15 border border-cyan-500/25 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-cyan-400" />
                </div>
                <div>
                  <div className="font-black text-sm">تالار</div>
                  <div className="text-white/35 text-[10px]">بازی‌های آزاد</div>
                </div>
              </button>

              <button
                onClick={() => router.push('/game/duel/create')}
                className="bg-white/5 border border-white/8 hover:border-rose-500/30 hover:bg-rose-500/5 rounded-2xl p-4 flex flex-col gap-2 text-white transition-all active:scale-95 relative overflow-hidden"
              >
                <div className="absolute top-2 left-2 bg-rose-500/20 text-rose-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-500/25">
                  خصوصی
                </div>
                <div className="w-9 h-9 bg-rose-500/15 border border-rose-500/25 rounded-xl flex items-center justify-center mt-1">
                  <Trophy size={18} className="text-rose-400" />
                </div>
                <div>
                  <div className="font-black text-sm">دوئل</div>
                  <div className="text-white/35 text-[10px]">با دوستت بازی کن</div>
                </div>
              </button>
            </div>

            {/* Active matches */}
            {activeMatches.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <h3 className="text-white/40 font-bold text-xs uppercase tracking-wider">
                    بازی‌های فعال ({activeMatches.length})
                  </h3>
                </div>
                {activeMatches.map(match => (
                  <ActiveMatchCard
                    key={match.matchId}
                    match={match}
                    currentPlayerId={resolveMatchPlayerId(match, playerIdCandidates) || currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-base">جدول برترین بازیکنان</h2>
              <button onClick={fetchLeaderboard} className="text-violet-400 text-xs hover:text-violet-300 transition-colors font-bold">
                بروزرسانی ↻
              </button>
            </div>

            {leaderboardLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Trophy size={44} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">هنوز داده‌ای موجود نیست</p>
              </div>
            ) : (
              <>
                {/* Podium */}
                {leaderboard.length >= 3 && (
                  <div className="flex items-end justify-center gap-4 py-8 mb-2 relative">
                    {/* 2nd */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push(`/game/profile/${leaderboard[1].userId}`)}>
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-500/40">
                        <Avatar src={leaderboard[1].avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${leaderboard[1].userId}`} alt={leaderboard[1].name} className="w-full h-full" />
                      </div>
                      <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl px-3 py-3 text-center w-20">
                        <div className="text-slate-400 font-black text-lg">۲</div>
                        <p className="text-white font-bold text-xs truncate">{leaderboard[1].name}</p>
                        <p className="text-amber-400/60 text-[10px] font-bold">{leaderboard[1].coins.toLocaleString('fa-IR')}</p>
                      </div>
                    </div>
                    {/* 1st */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform relative" onClick={() => router.push(`/game/profile/${leaderboard[0].userId}`)}>
                      <Crown size={26} className="text-amber-400 absolute -top-10" fill="currentColor" />
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg shadow-amber-400/15">
                        <Avatar src={leaderboard[0].avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${leaderboard[0].userId}`} alt={leaderboard[0].name} className="w-full h-full" />
                      </div>
                      <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl px-3 py-4 text-center w-24">
                        <div className="text-amber-400 font-black text-xl">۱</div>
                        <p className="text-white font-bold text-xs truncate">{leaderboard[0].name}</p>
                        <p className="text-amber-400 text-[10px] font-bold">{leaderboard[0].coins.toLocaleString('fa-IR')}</p>
                      </div>
                    </div>
                    {/* 3rd */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push(`/game/profile/${leaderboard[2].userId}`)}>
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-700/40">
                        <Avatar src={leaderboard[2].avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${leaderboard[2].userId}`} alt={leaderboard[2].name} className="w-full h-full" />
                      </div>
                      <div className="bg-amber-700/10 border border-amber-700/20 rounded-xl px-3 py-3 text-center w-20">
                        <div className="text-amber-700 font-black text-lg">۳</div>
                        <p className="text-white font-bold text-xs truncate">{leaderboard[2].name}</p>
                        <p className="text-amber-400/50 text-[10px] font-bold">{leaderboard[2].coins.toLocaleString('fa-IR')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rest */}
                <div className="space-y-2">
                  {leaderboard.slice(3).map((entry) => (
                    <div key={entry.userId} className="bg-white/5 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="text-white/25 font-black text-sm w-5 text-center">{entry.rank}</span>
                      <div
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 group"
                        onClick={() => router.push(`/game/profile/${entry.userId}`)}
                      >
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                          <Avatar src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${entry.userId}`} alt={entry.name} className="w-full h-full" />
                        </div>
                        <span className="text-white font-bold text-sm truncate group-hover:text-violet-300 transition-colors">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="relative w-3.5 h-3.5"><Image src="/images/coin.png" alt="coin" fill /></div>
                        <span className="text-amber-300 font-bold text-sm">{entry.coins.toLocaleString('fa-IR')}</span>
                      </div>
                      {entry.userId === currentUserId && (
                        <span className="text-[9px] bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded-full font-bold border border-violet-500/25">شما</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 md:right-[220px] bg-[#0d0c1e]/90 backdrop-blur-md border-t border-white/5 flex items-center justify-around py-2.5 px-6 z-50">
        <button
          onClick={() => router.push('/game/profile')}
          className="flex flex-col items-center gap-1 text-white/25 hover:text-violet-400 transition-colors"
        >
          <UserCircle size={21} />
          <span className="text-[9px] font-bold">پروفایل</span>
        </button>
        <button
          onClick={() => router.push('/game/lobby')}
          className="flex flex-col items-center gap-1 text-white/25 hover:text-cyan-400 transition-colors"
        >
          <Users size={21} />
          <span className="text-[9px] font-bold">تالار</span>
        </button>
        <button
          onClick={() => setTab('home')}
          className={cn('flex flex-col items-center gap-1 transition-colors', tab === 'home' ? 'text-violet-400' : 'text-white/25 hover:text-white/50')}
        >
          <Home size={21} />
          <span className="text-[9px] font-bold">خانه</span>
        </button>
        <button
          onClick={() => setTab('leaderboard')}
          className={cn('flex flex-col items-center gap-1 transition-colors', tab === 'leaderboard' ? 'text-violet-400' : 'text-white/25 hover:text-white/50')}
        >
          <Trophy size={21} />
          <span className="text-[9px] font-bold">برترین‌ها</span>
        </button>
        <button
          onClick={() => router.push('/game/settings')}
          className="flex flex-col items-center gap-1 text-white/25 hover:text-white/50 transition-colors"
        >
          <Settings size={21} />
          <span className="text-[9px] font-bold">تنظیمات</span>
        </button>
      </div>
    </div>
  );
}
