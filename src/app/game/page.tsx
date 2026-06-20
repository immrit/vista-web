"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Home, Settings, Users, Gamepad2, Medal, Crown, UserCircle } from 'lucide-react';
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
    const data = await apiClient.get<{ coins: number; xp: number; level: number, displayName: string | null, avatarUrl: string | null }>('/v1/game/profile');
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
    if (!loading && !currentUserId) { router.push('/auth'); }
  }, [loading, currentUserId, router]);

  useEffect(() => {
    if (tab === 'leaderboard') { fetchLeaderboard(); }
  }, [tab, fetchLeaderboard]);

  // Tiered entry fee by active-match count: 1-5 → 50, 6-10 → 200, 11-15 → 300, cap 15.
  const MAX_MATCHES = 15;
  const matchFeeFor = (active: number) =>
    active < 5 ? 50 : active < 10 ? 200 : active < MAX_MATCHES ? 300 : -1;
  const hasWaitingMatch = activeMatches.some((match) => {
    const matchPlayerId = resolveMatchPlayerId(match, playerIdCandidates);
    return match.player1.id === matchPlayerId && !match.player2 && (match.status === 'waiting' || match.status === 'waiting_for_opponent');
  });
  const activeCount = activeMatches.length;
  const nextMatchCost = matchFeeFor(activeCount); // -1 when at cap
  const isReady = !loading && !!currentUserId && coins !== null;
  const hasEnoughCoins = hasWaitingMatch || (nextMatchCost >= 0 && coins !== null && coins >= nextMatchCost);
  const isAtCapacity = nextMatchCost < 0 && !hasWaitingMatch;
  const startDisabled = !isReady || isMatchmaking || isAtCapacity || !hasEnoughCoins;

  const handleStartGame = async () => {
    if (loading || !currentUserId || coins === null) return;
    if (!hasWaitingMatch && nextMatchCost > 0 && coins < nextMatchCost) {
      alert(`موجودی سکه کافی نیست! هزینه شروع این بازی ${nextMatchCost.toLocaleString('fa-IR')} سکه است.`);
      return;
    }
    try {
      setIsMatchmaking(true);
      const data = await apiClient.post<{ matchId: string, status: string }>('/v1/game/matchmake', {
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

  if (loading || !currentUserId) {
    return <div className="min-h-screen bg-[#4c1d95] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#4c1d95] pb-20 font-sans relative overflow-x-hidden">
      {/* Stars background pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'8\' y=\'40\' font-family=\'Arial\' font-size=\'36\' fill=\'white\'%3E%E2%98%85%3C/text%3E%3C/svg%3E")', backgroundSize: '60px 60px' }}></div>

      {/* Top Bar */}
      <div className="bg-[#3b0764] px-3 py-3 flex items-center justify-between text-white text-sm shadow-md sticky top-0 z-50">
        <div className="flex items-center space-x-2 space-x-reverse flex-1">
          {/* Level / XP bar */}
          <div className="flex bg-[#2e1065] rounded-md overflow-hidden relative flex-1 h-8 items-center pl-8">
            <div className="bg-[#a855f7] h-full transition-all" style={{width: `${Math.min(100, Math.max(0, ((xp - Math.pow(level - 1, 2) * 100) / (Math.pow(level, 2) * 100 - Math.pow(level - 1, 2) * 100)) * 100))}%`}}></div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px]">
              {xp.toLocaleString('fa-IR')} / {(Math.pow(level, 2) * 100).toLocaleString('fa-IR')} XP
            </div>
            <div className="absolute left-0 top-0 h-full bg-[#1e0a3c] px-2 flex items-center justify-center font-black text-xs border-r border-white/10 text-white">
              Lvl {level}
            </div>
          </div>
          {/* Coins */}
          <button
            onClick={() => router.push('/game/store')}
            className="flex items-center bg-[#2e1065] rounded-md h-8 px-3 min-w-[80px] space-x-1.5 space-x-reverse hover:bg-[#1e0a3c] active:scale-95 transition-all cursor-pointer border border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
          >
            <div className="w-4 h-4 flex items-center justify-center bg-yellow-400 text-yellow-900 rounded-full font-bold text-[10px] leading-none pb-0.5">+</div>
            <span className="font-bold text-sm text-white">{coins !== null ? coins.toLocaleString('fa-IR') : '...'}</span>
            <div className="w-5 h-5 relative"><Image src="/images/coin.png" alt="coin" fill /></div>
          </button>
        </div>
        <div className="mr-2 text-white/70 font-bold text-sm">ویستا کوییز</div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Tab buttons */}
        <div className="flex bg-[#2e1065]/60 rounded-2xl p-1 mb-5 border border-white/10">
          <button
            onClick={() => setTab('home')}
            className={cn("flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-1.5 space-x-reverse",
              tab === 'home' ? "bg-white text-[#4c1d95] shadow-md" : "text-white/70 hover:text-white"
            )}
          >
            <Home size={16} /> <span>خانه</span>
          </button>
          <button
            onClick={() => setTab('leaderboard')}
            className={cn("flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-1.5 space-x-reverse",
              tab === 'leaderboard' ? "bg-white text-[#4c1d95] shadow-md" : "text-white/70 hover:text-white"
            )}
          >
            <Trophy size={16} /> <span>جدول برترین‌ها</span>
          </button>
        </div>

        {tab === 'home' && (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex flex-col items-center space-y-3 py-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#a855f7] bg-white shadow-lg shadow-purple-900/50">
                  <Avatar src={avatarUrl} alt="Avatar" className="w-full h-full" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#78c02c] text-white text-xs font-bold px-3 py-0.5 rounded-full shadow">
                  {displayName}
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-white/60 text-xs">
                <Users size={12} />
                <span>عضو ویستا کوییز</span>
              </div>
            </div>

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              disabled={startDisabled}
              id="start-game-btn"
              className={cn(
                "w-full rounded-[2rem] p-5 flex flex-col items-center justify-center transition-all active:translate-y-[8px] active:shadow-none border-2 relative",
                startDisabled
                  ? "bg-slate-400 border-slate-300 shadow-[0_8px_0_#64748b] cursor-not-allowed"
                  : "bg-gradient-to-b from-[#87d235] to-[#73bc26] border-[#b5e786] shadow-[0_8px_0_#5b9a1c]"
              )}
            >
              <div className="flex items-center space-x-3 space-x-reverse text-white">
                <span className="font-black text-3xl drop-shadow-md">
                  {!isReady ? 'در حال بارگذاری...'
                    : isMatchmaking ? 'در حال اتصال...'
                    : isAtCapacity ? 'ظرفیت پر است'
                    : !hasEnoughCoins ? 'سکه کافی نیست'
                    : hasWaitingMatch ? 'ادامه انتظار'
                    : 'شروع بازی جدید'}
                </span>
                {!startDisabled && <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-[12px] border-r-white drop-shadow-md"></div>}
              </div>
              {!startDisabled && (
                <p className="text-white/70 text-sm mt-1 font-medium">
                  {hasWaitingMatch ? 'شما در صف انتظار هستید' : `هزینه: ${nextMatchCost.toLocaleString('fa-IR')} سکه`}
                </p>
              )}
              {!startDisabled && <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20"><Gamepad2 size={40} /></div>}
            </button>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                id="lobby-btn"
                onClick={() => router.push('/game')}
                className="bg-gradient-to-b from-[#7c3aed] to-[#6d28d9] border border-[#a78bfa] rounded-2xl shadow-[0_6px_0_#4c1d95] p-4 flex flex-col items-start text-white space-y-1 active:translate-y-[6px] active:shadow-none transition-all"
              >
                <Users size={24} className="text-white/80" />
                <span className="font-black text-lg">تالار</span>
                <span className="text-[11px] opacity-80">بازی‌های آزاد رو ببین</span>
              </button>

              <button
                id="duel-btn"
                onClick={() => router.push('/game/duel/create')}
                className="bg-gradient-to-b from-[#f36b59] to-[#ea4b34] border border-[#f8a89d] rounded-2xl shadow-[0_6px_0_#bc2e1a] p-4 flex flex-col items-start text-white space-y-1 active:translate-y-[6px] active:shadow-none transition-all relative overflow-hidden"
              >
                <div className="absolute -left-2 -top-2 bg-red-700 text-white text-[9px] font-bold px-4 py-0.5 rotate-[-45deg]">دوئل</div>
                <Trophy size={24} className="text-[#fbcf68] z-10" fill="#fbcf68" />
                <span className="font-black text-lg z-10">دوئل خصوصی</span>
                <span className="text-[11px] opacity-80 z-10">با دوستت بازی کن</span>
              </button>
            </div>

            {/* Daily spin wheel */}
            <button
              onClick={() => router.push('/game/spin')}
              className="w-full bg-gradient-to-l from-[#a855f7] to-[#7c3aed] border-2 border-violet-300 rounded-2xl p-3.5 flex items-center gap-3 text-white shadow-[0_6px_0_#5b21b6] active:translate-y-[6px] active:shadow-none transition-all"
            >
              <div className="text-3xl">🎡</div>
              <div className="flex-1 text-right">
                <div className="font-black text-base drop-shadow">گردونه شانس روزانه</div>
                <div className="text-[11px] opacity-90 font-bold">هر روز سکه رایگان بچرخان</div>
              </div>
              <span className="bg-white/25 rounded-full px-3 py-1 text-xs font-black">رایگان</span>
            </button>

            {/* Daily missions */}
            <button
              onClick={() => router.push('/game/missions')}
              className="w-full bg-gradient-to-l from-[#fbbf24] to-[#f59e0b] border-2 border-yellow-300 rounded-2xl p-3.5 flex items-center gap-3 text-white shadow-[0_6px_0_#b45309] active:translate-y-[6px] active:shadow-none transition-all"
            >
              <div className="text-3xl">🎯</div>
              <div className="flex-1 text-right">
                <div className="font-black text-base drop-shadow">مأموریت‌های روزانه</div>
                <div className="text-[11px] opacity-90 font-bold">کامل کن، سکه رایگان بگیر</div>
              </div>
              <span className="bg-white/25 rounded-full px-3 py-1 text-xs font-black">جایزه</span>
            </button>

            {/* Active Matches */}
            {activeMatches.length > 0 && (
              <div className="mt-2 space-y-3">
                <h3 className="text-white font-bold px-1 flex items-center space-x-2 space-x-reverse">
                  <Gamepad2 size={16} className="text-[#78c02c]" />
                  <span>بازی‌های فعال شما ({activeMatches.length})</span>
                </h3>
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-black text-lg">جدول برترین بازیکنان</h2>
              <button onClick={fetchLeaderboard} className="text-white/60 text-xs hover:text-white transition-colors">
                بروزرسانی ↻
              </button>
            </div>

            {leaderboardLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-10 text-white/60">
                <Trophy size={48} className="mx-auto mb-3 opacity-30" />
                <p>هنوز داده‌ای موجود نیست</p>
              </div>
            ) : (
              <>
                {leaderboard.length >= 3 && (
                  <div className="flex items-end justify-center space-x-3 space-x-reverse py-4 mb-2">
                    <div className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push(`/game/profile/${leaderboard[1].userId}`)}>
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-300 shadow-lg">
                        <Avatar src={leaderboard[1].avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${leaderboard[1].userId}`} alt={leaderboard[1].name} className="w-full h-full" />
                      </div>
                      <div className="bg-[#a0aec0] rounded-xl px-3 py-4 text-center w-20 shadow-[0_4px_0_#718096]">
                        <Medal size={16} className="text-white mx-auto mb-1" />
                        <p className="text-white font-black text-xs truncate">{leaderboard[1].name}</p>
                        <p className="text-white/80 text-[10px]">{leaderboard[1].coins.toLocaleString('fa-IR')}💰</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2 z-10 cursor-pointer hover:scale-105 transition-transform relative" onClick={() => router.push(`/game/profile/${leaderboard[0].userId}`)}>
                      <div className="absolute -top-6 text-yellow-400 drop-shadow-md"><Crown size={32} fill="currentColor" /></div>
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                        <Avatar src={leaderboard[0].avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${leaderboard[0].userId}`} alt={leaderboard[0].name} className="w-full h-full" />
                      </div>
                      <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-xl px-3 py-5 text-center w-24 shadow-[0_6px_0_#b45309]">
                        <Trophy size={18} className="text-white mx-auto mb-1" fill="white" />
                        <p className="text-white font-black text-xs truncate">{leaderboard[0].name}</p>
                        <p className="text-white/90 text-[10px]">{leaderboard[0].coins.toLocaleString('fa-IR')}💰</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push(`/game/profile/${leaderboard[2].userId}`)}>
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-600 shadow-lg">
                        <Avatar src={leaderboard[2].avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${leaderboard[2].userId}`} alt={leaderboard[2].name} className="w-full h-full" />
                      </div>
                      <div className="bg-gradient-to-b from-amber-600 to-amber-800 rounded-xl px-3 py-3 text-center w-20 shadow-[0_4px_0_#7c5013]">
                        <Medal size={16} className="text-amber-300 mx-auto mb-1" />
                        <p className="text-white font-black text-xs truncate">{leaderboard[2].name}</p>
                        <p className="text-white/80 text-[10px]">{leaderboard[2].coins.toLocaleString('fa-IR')}💰</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2 mt-4">
                  {leaderboard.slice(3).map((entry) => (
                    <div key={entry.userId} className="bg-[#2e1065]/60 rounded-2xl px-4 py-3 flex items-center space-x-3 space-x-reverse border border-white/10">
                      <span className="text-white/60 font-black text-lg w-7 text-center">{entry.rank}</span>
                      <div className="flex items-center space-x-3 space-x-reverse cursor-pointer group" onClick={() => router.push(`/game/profile/${entry.userId}`)}>
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 group-hover:border-white transition-colors">
                          <Avatar src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${entry.userId}`} alt={entry.name} className="w-full h-full" />
                        </div>
                        <span className="text-white font-bold text-sm group-hover:text-purple-300 transition-colors">{entry.name}</span>
                      </div>
                      <div className="flex-1 min-w-0"></div>
                      <div className="flex items-center space-x-1.5 space-x-reverse">
                        <div className="relative w-4 h-4"><Image src="/images/coin.png" alt="coin" fill /></div>
                        <span className="text-white font-bold text-sm">{entry.coins.toLocaleString('fa-IR')}</span>
                      </div>
                      {entry.userId === currentUserId && (
                        <span className="text-[10px] bg-[#78c02c] text-white px-2 py-0.5 rounded-full font-bold">شما</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#3b0764] border-t border-[#2e1065] flex items-center justify-around py-2 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-50">
        <button onClick={() => router.push('/game/profile')} className="flex flex-col items-center text-white/50 hover:text-white transition-colors">
          <UserCircle size={24} />
          <span className="text-[10px] mt-1 font-bold">پروفایل</span>
        </button>
        <button id="lobby-nav-btn" onClick={() => router.push('/game')} className="flex flex-col items-center text-white/50 hover:text-white transition-colors">
          <Users size={24} />
          <span className="text-[10px] mt-1 font-bold">تالار</span>
        </button>
        <button
          onClick={() => setTab('home')}
          id="center-play-btn"
          className={cn("flex flex-col items-center -mt-6 transition-colors", tab === 'home' ? "text-white" : "text-white/70")}
        >
          <div className={cn(
            "rounded-full p-4 mb-1 border-4 transition-colors",
            tab === 'home' ? "bg-[#87d235] border-[#5da01f]" : "bg-[#3b0764] border-[#2e1065] hover:bg-[#4c1d95]"
          )}>
            <Home size={28} />
          </div>
          <span className="text-[10px] font-bold">خانه</span>
        </button>
        <button onClick={() => setTab('leaderboard')} className={cn("flex flex-col items-center transition-colors", tab === 'leaderboard' ? "text-white" : "text-white/50 hover:text-white")}>
          <Trophy size={24} />
          <span className="text-[10px] mt-1 font-bold">برترین‌ها</span>
        </button>
        <button id="settings-nav-btn" onClick={() => router.push('/game/settings')} className="flex flex-col items-center text-white/50 hover:text-white transition-colors">
          <Settings size={24} />
          <span className="text-[10px] mt-1 font-bold">تنظیمات</span>
        </button>
      </div>
    </div>
  );
}
