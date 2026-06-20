"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Trophy, Star, Zap } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { MatchState } from '@/lib/game/types';
import { CATEGORIES } from '@/lib/game/questions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { getCurrentRound, isAnswerPending, isPlayerTurn } from '@/lib/game/state';
import { getAuthPlayerCandidates, resolveMatchPlayerId } from '@/lib/game/player';

function GameLoader() {
  return (
    <div className="min-h-screen bg-[#0d0c1e] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );
}

export default function MatchDetailsPage() {
  const { matchId } = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [match, setMatch] = useState<MatchState | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const playerIdCandidates = getAuthPlayerCandidates(user?.id, profile?.id, profile?.user_id);
  const currentUserId = resolveMatchPlayerId(match, playerIdCandidates);

  const fetchMatch = useCallback(async () => {
    try {
      const data = await apiClient.get<MatchState>(`/v1/game/match/${matchId}`);
      if (data) setMatch(data);
    } catch (e: any) {
      console.error('Failed to fetch match:', e);
      if (e.status === 403 || e.status === 404) router.push('/game');
    } finally {
      setPageLoading(false);
    }
  }, [matchId, router]);

  useEffect(() => {
    if (authLoading || !currentUserId) return;
    fetchMatch();
    const interval = setInterval(fetchMatch, 3000);
    return () => clearInterval(interval);
  }, [authLoading, currentUserId, fetchMatch]);

  useEffect(() => {
    if (!authLoading && !currentUserId) router.push('/auth');
  }, [authLoading, currentUserId, router]);

  if (authLoading || pageLoading || !currentUserId || !match) return <GameLoader />;

  const isPlayer1 = match.player1.id === currentUserId;
  const isPlayer2 = match.player2?.id === currentUserId;
  if (!isPlayer1 && !isPlayer2) return <GameLoader />;

  const me = isPlayer1 ? match.player1 : match.player2!;
  const opponent = isPlayer1 ? match.player2 : match.player1;

  const currentRound = getCurrentRound(match);
  const isMyTurn = isPlayerTurn(match, currentUserId, currentRound);
  const isWaitingForOpponent = match.status === 'waiting_for_opponent' || match.status === 'waiting' || !match.player2;
  const isFinished = match.status === 'finished';
  const canPlay = isMyTurn && !isFinished;

  const totalRounds = 6;
  const rounds = Array.from({ length: totalRounds }).map((_, i) => match.rounds[i] || null);

  const isWinner = match.winnerId === currentUserId;
  const isTie = match.winnerId === 'tie';

  const myCorrectAnswers = rounds.filter(Boolean).reduce((acc, r) => {
    const answers = isPlayer1 ? r!.player1Answers : r!.player2Answers;
    return acc + answers.filter((a, i) => r?.questions?.[i] && a === r.questions[i].correctOptionIndex).length;
  }, 0);

  const earnedCoins = myCorrectAnswers * 10 + (isWinner ? 50 : isTie ? 20 : 0);
  const earnedXP = myCorrectAnswers * 20 + (isWinner ? 100 : isTie ? 50 : 20);

  // Result screen
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#0d0c1e] font-sans flex flex-col relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-[#0d0c1e]/80 backdrop-blur-md border-b border-white/5">
          <button onClick={() => router.push('/game')} className="w-9 h-9 flex items-center justify-center bg-white/8 border border-white/10 rounded-xl text-white hover:bg-white/15 transition-colors">
            <ChevronRight size={20} />
          </button>
          <h1 className="text-white font-black text-base">ویستا کوییز</h1>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10 gap-8 py-10">
          {/* Result badge */}
          <div className={cn(
            'w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl border-2',
            isWinner
              ? 'bg-amber-500/15 border-amber-400/50 shadow-amber-500/20'
              : isTie
                ? 'bg-slate-500/15 border-slate-400/50 shadow-slate-500/20'
                : 'bg-rose-500/15 border-rose-500/50 shadow-rose-500/20'
          )}>
            {isWinner
              ? <Trophy size={52} className="text-amber-400" fill="currentColor" />
              : isTie
                ? <Star size={52} className="text-slate-300" fill="currentColor" />
                : <Zap size={52} className="text-rose-400" />
            }
          </div>

          <div className="text-center space-y-3">
            <h2 className={cn(
              'text-4xl font-black',
              isWinner ? 'text-amber-400' : isTie ? 'text-slate-300' : 'text-rose-400'
            )}>
              {isWinner ? '🎉 پیروز شدی!' : isTie ? '🤝 مساوی!' : '😔 باختی!'}
            </h2>
            <div className="flex items-center justify-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
              <div className="text-center">
                <div className="text-amber-400 font-black text-xl">+{earnedCoins.toLocaleString('fa-IR')}</div>
                <div className="text-white/40 text-xs font-bold">سکه</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-cyan-400 font-black text-xl">+{earnedXP.toLocaleString('fa-IR')}</div>
                <div className="text-white/40 text-xs font-bold">XP</div>
              </div>
            </div>
          </div>

          {/* Scoreboard */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 w-full max-w-xs">
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => router.push(`/game/profile/${me.id}`)}
                  className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/15 cursor-pointer hover:border-violet-500/50 transition-all"
                >
                  <img src={me.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-xs font-bold">{me.name}</span>
                <span className="text-3xl font-black text-white">{me.score}</span>
                {isWinner && <span className="text-amber-400 text-[10px] font-black">برنده 🏆</span>}
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="text-white/20 font-black text-sm">VS</div>
              </div>

              <div className="flex flex-col items-center gap-2">
                {opponent ? (
                  <>
                    <div
                      onClick={() => router.push(`/game/profile/${opponent.id}`)}
                      className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/15 cursor-pointer hover:border-violet-500/50 transition-all"
                    >
                      <img src={opponent.avatarUrl} alt="Opponent" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white text-xs font-bold">{opponent.name}</span>
                    <span className="text-3xl font-black text-white">{opponent.score}</span>
                    {match.winnerId === opponent.id && <span className="text-amber-400 text-[10px] font-black">برنده 🏆</span>}
                  </>
                ) : (
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center text-white/20 text-2xl">?</div>
                )}
              </div>
            </div>
          </div>

          {/* Round summary */}
          <div className="w-full max-w-xs space-y-2">
            {rounds.filter(Boolean).map((round, idx) => {
              const catId = round!.category as keyof typeof CATEGORIES | undefined;
              const myA = isPlayer1 ? round!.player1Answers : round!.player2Answers;
              const myT = isPlayer1 ? round!.player1Times : round!.player2Times;
              const oppA = isPlayer1 ? round!.player2Answers : round!.player1Answers;
              const oppT = isPlayer1 ? round!.player2Times : round!.player1Times;

              const renderDots = (answers: number[], times: number[]) =>
                [0, 1, 2].map((i) => {
                  const ans = answers[i];
                  const t = times[i];
                  const q = round!.questions[i];
                  let cls = 'bg-white/10';
                  if (!isAnswerPending(ans, t) && q) {
                    cls = ans === q.correctOptionIndex ? 'bg-emerald-500' : 'bg-rose-500';
                  }
                  return <div key={i} className={cn('w-4 h-4 rounded-full', cls)} />;
                });

              return (
                <div key={idx} className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 flex items-center justify-between">
                  <div className="flex gap-1">{renderDots(myA, myT)}</div>
                  <span className="text-white/40 text-[10px] font-bold">
                    {catId && CATEGORIES[catId] ? `${CATEGORIES[catId].icon} ${CATEGORIES[catId].label}` : `دور ${idx + 1}`}
                  </span>
                  <div className="flex gap-1">{renderDots(oppA, oppT)}</div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="w-full max-w-xs space-y-3 pb-6">
            <button
              onClick={() => router.push('/game')}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-violet-500/25"
            >
              بازی جدید
            </button>
            <button
              onClick={() => router.push('/game')}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/8 text-white/50 font-bold py-3 rounded-2xl transition-colors"
            >
              بازگشت به خانه
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active match view
  return (
    <div className="min-h-screen bg-[#0d0c1e] font-sans flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-[#0d0c1e]/80 backdrop-blur-md border-b border-white/5">
        <button onClick={() => router.push('/game')} className="w-9 h-9 flex items-center justify-center bg-white/8 border border-white/10 rounded-xl text-white hover:bg-white/15 transition-colors">
          <ChevronRight size={20} />
        </button>
        <h1 className="text-white font-black text-base">ویستا کوییز</h1>
        <div className="w-9" />
      </div>

      {/* Players & score */}
      <div className="relative z-10 px-4 pt-5 pb-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            {/* Me */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => router.push(`/game/profile/${me.id}`)}
                className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-violet-500/50 cursor-pointer hover:border-violet-400 transition-all"
              >
                <img src={me.avatarUrl} alt="Me" className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-[10px] font-bold truncate max-w-[64px] text-center">{me.name}</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-3">
              <div className="text-4xl font-black text-white">{me.score}</div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-white/20 text-xs font-bold">VS</div>
                <div className="text-white/30 text-[10px] font-bold">
                  دور {match.currentRoundIndex + 1}/{totalRounds}
                </div>
              </div>
              <div className="text-4xl font-black text-white">{opponent ? opponent.score : 0}</div>
            </div>

            {/* Opponent */}
            <div className="flex flex-col items-center gap-2">
              {opponent ? (
                <>
                  <div
                    onClick={() => router.push(`/game/profile/${opponent.id}`)}
                    className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 cursor-pointer hover:border-white/40 transition-all"
                  >
                    <img src={opponent.avatarUrl} alt="Opponent" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white text-[10px] font-bold truncate max-w-[64px] text-center">{opponent.name}</span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center text-white/30 text-xl">?</div>
                  <span className="text-white/30 text-[10px] font-bold">منتظر حریف</span>
                </>
              )}
            </div>
          </div>

          {/* Round progress bar */}
          <div className="mt-4 flex gap-1.5 justify-center">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i < match.currentRoundIndex
                    ? 'bg-emerald-500 flex-[1.5]'
                    : i === match.currentRoundIndex && match.status === 'in_progress'
                      ? 'bg-violet-400 flex-[2] animate-pulse'
                      : 'bg-white/10 flex-1'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Rounds list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 relative z-10 pb-28">
        {rounds.map((round, idx) => {
          const isCurrentRound = match.status === 'in_progress' && match.currentRoundIndex === idx;
          const hasPlayed = round !== null;
          const catId = round?.category as keyof typeof CATEGORIES | undefined;

          if (!hasPlayed && !isCurrentRound) {
            return (
              <div key={idx} className="h-14 bg-white/3 border border-white/5 rounded-xl flex items-center justify-center">
                <span className="text-white/15 text-xs font-bold">دور {idx + 1}</span>
              </div>
            );
          }

          if (isCurrentRound && round) {
            const myTurn = isPlayerTurn(match, currentUserId, round);
            return (
              <div key={idx} className={cn(
                'h-14 rounded-xl border flex items-center justify-between px-4',
                myTurn
                  ? 'bg-violet-500/10 border-violet-500/40'
                  : 'bg-white/5 border-white/10'
              )}>
                <div className="flex-1">
                  {myTurn && (
                    <span className="text-violet-300 text-sm font-black animate-pulse">نوبت توئه ▶</span>
                  )}
                </div>
                <div className="bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-white font-bold text-xs">
                  {catId && CATEGORIES[catId]
                    ? <span className="flex items-center gap-1"><span>{CATEGORIES[catId].icon}</span>{CATEGORIES[catId].label}</span>
                    : 'انتخاب موضوع'
                  }
                </div>
                <div className="flex-1 flex justify-end">
                  {!myTurn && (
                    <span className="text-white/30 text-xs font-bold">نوبت حریف</span>
                  )}
                </div>
              </div>
            );
          }

          if (hasPlayed && round) {
            const myAnswers = isPlayer1 ? round.player1Answers : round.player2Answers;
            const oppAnswers = isPlayer1 ? round.player2Answers : round.player1Answers;
            const myTimes = isPlayer1 ? round.player1Times : round.player2Times;
            const oppTimes = isPlayer1 ? round.player2Times : round.player1Times;

            const renderCircles = (answers: number[], times: number[]) =>
              [0, 1, 2].map((i) => {
                const ans = answers[i];
                const time = times[i];
                const q = round.questions[i];
                let cls = 'bg-white/10';
                if (!isAnswerPending(ans, time) && q) {
                  cls = ans === q.correctOptionIndex ? 'bg-emerald-500' : 'bg-rose-500';
                }
                return <div key={i} className={cn('w-4 h-4 rounded-full shadow-sm', cls)} />;
              });

            return (
              <div key={idx} className="h-14 bg-white/5 border border-white/8 rounded-xl flex items-center justify-between px-3">
                <div className="flex gap-1">{renderCircles(myAnswers, myTimes)}</div>
                <div className="text-white/40 text-[10px] font-bold">
                  {catId && CATEGORIES[catId]
                    ? `${CATEGORIES[catId].icon} ${CATEGORIES[catId].label}`
                    : `دور ${idx + 1}`
                  }
                </div>
                <div className="flex gap-1">{renderCircles(oppAnswers, oppTimes)}</div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Bottom play button */}
      <div className="fixed bottom-6 left-0 right-0 md:right-[220px] px-5 z-50">
        <button
          onClick={() => router.push(`/game/play/${matchId}`)}
          disabled={!canPlay}
          className={cn(
            'w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-black text-xl transition-all',
            canPlay
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/30 active:scale-[0.98]'
              : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
          )}
        >
          <span>{canPlay ? 'بازی کن' : isWaitingForOpponent ? 'منتظر حریف' : 'نوبت حریفه'}</span>
          {canPlay && (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
