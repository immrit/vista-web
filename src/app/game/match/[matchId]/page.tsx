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
      if (e.status === 403 || e.status === 404) {
        router.push('/game');
      }
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
    if (!authLoading && !currentUserId) {
      router.push('/auth');
    }
  }, [authLoading, currentUserId, router]);



  if (authLoading || pageLoading || !currentUserId || !match) {
    return <div className="min-h-screen bg-[#1a6ebd] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>;
  }

  const isPlayer1 = match.player1.id === currentUserId;
  const isPlayer2 = match.player2?.id === currentUserId;
  if (!isPlayer1 && !isPlayer2) {
    return <div className="min-h-screen bg-[#1a6ebd] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>;
  }
  const me = isPlayer1 ? match.player1 : match.player2!;
  const opponent = isPlayer1 ? match.player2 : match.player1;

  // Turn logic
  const currentRound = getCurrentRound(match);
  const isMyTurn = isPlayerTurn(match, currentUserId, currentRound);
  const isWaitingForOpponent = match.status === 'waiting_for_opponent' || match.status === 'waiting' || !match.player2;
  const isFinished = match.status === 'finished';
  const canPlay = isMyTurn && !isFinished;

  // Total 6 rounds
  const totalRounds = 6;
  const rounds = Array.from({ length: totalRounds }).map((_, i) => match.rounds[i] || null);

  // Determine winner
  const isWinner = match.winnerId === currentUserId;
  const isTie = match.winnerId === 'tie';
  const isLoser = isFinished && !isWinner && !isTie;

  const myCorrectAnswers = rounds.filter(r => r !== null).reduce((acc, r) => {
    const answers = isPlayer1 ? r!.player1Answers : r!.player2Answers;
    return acc + answers.filter((a, i) => r?.questions?.[i] && a === r.questions[i].correctOptionIndex).length;
  }, 0);
  
  const earnedCoins = myCorrectAnswers * 10 + (isWinner ? 50 : isTie ? 20 : 0);
  const earnedXP = myCorrectAnswers * 20 + (isWinner ? 100 : isTie ? 50 : 20);

  // Finished result screen
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#1a6ebd] font-sans flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'10\' y=\'40\' font-family=\'Arial\' font-size=\'40\' fill=\'white\' font-weight=\'bold\'%3E?%3C/text%3E%3C/svg%3E")', backgroundSize: '60px 60px' }}></div>

        {/* Header */}
        <div className="bg-[#114b82] px-4 py-3 flex items-center justify-between text-white shadow-md relative z-10">
          <button onClick={() => router.push('/game')} className="p-1 active:scale-95"><ChevronRight size={28} /></button>
          <h1 className="text-xl font-bold">ویستا کوییز</h1>
          <div className="w-8" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 space-y-8 py-10">
          {/* Result Badge */}
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 animate-bounce",
            isWinner ? "bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-300" :
            isTie ? "bg-gradient-to-b from-slate-400 to-slate-600 border-slate-300" :
            "bg-gradient-to-b from-red-500 to-red-700 border-red-400"
          )}>
            {isWinner ? (
              <Trophy size={56} className="text-white drop-shadow-lg" fill="white" />
            ) : isTie ? (
              <Star size={56} className="text-white drop-shadow-lg" fill="white" />
            ) : (
              <Zap size={56} className="text-white drop-shadow-lg" />
            )}
          </div>

          <div className="text-center space-y-2">
            <h2 className={cn(
              "text-4xl font-black drop-shadow-lg",
              isWinner ? "text-yellow-300" : isTie ? "text-slate-200" : "text-red-300"
            )}>
              {isWinner ? '🎉 پیروز شدی!' : isTie ? '🤝 مساوی!' : '😔 باختی!'}
            </h2>
            <div className="flex flex-col items-center space-y-1 mt-2 bg-[#114b82]/40 rounded-xl p-3 border border-white/10 shadow-inner">
              <div className="text-yellow-300 font-bold text-lg flex items-center space-x-1 space-x-reverse">
                <span>+{earnedCoins.toLocaleString('fa-IR')}</span>
                <span>سکه</span>
              </div>
              <div className="text-[#20b2f5] font-bold text-lg flex items-center space-x-1 space-x-reverse">
                <span>+{earnedXP.toLocaleString('fa-IR')}</span>
                <span>XP</span>
              </div>
            </div>
          </div>

          {/* Scoreboard */}
          <div className="bg-[#114b82]/60 backdrop-blur-sm rounded-3xl p-6 w-full max-w-xs border border-white/20 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center space-y-2">
                <div onClick={() => router.push(`/game/profile/${me.id}`)} className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-lg cursor-pointer hover:border-white transition-all active:scale-95">
                  <img src={me.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-xs font-bold">{me.name}</span>
                <span className="text-3xl font-black text-white">{me.score}</span>
                {isWinner && <span className="text-yellow-300 text-xs font-bold">برنده 🏆</span>}
              </div>

              <div className="text-white/50 text-2xl font-black">VS</div>

              <div className="flex flex-col items-center space-y-2">
                {opponent ? (
                  <>
                    <div onClick={() => router.push(`/game/profile/${opponent.id}`)} className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-lg cursor-pointer hover:border-white transition-all active:scale-95">
                      <img src={opponent.avatarUrl} alt="Opponent" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white text-xs font-bold">{opponent.name}</span>
                    <span className="text-3xl font-black text-white">{opponent.score}</span>
                    {match.winnerId === opponent.id && <span className="text-yellow-300 text-xs font-bold">برنده 🏆</span>}
                  </>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 text-2xl">?</div>
                )}
              </div>
            </div>
          </div>

          {/* Round summary */}
          <div className="w-full max-w-xs space-y-2">
            {rounds.filter(r => r !== null).map((round, idx) => (
              <div key={idx} className="bg-[#114b82]/40 rounded-2xl px-4 py-2 flex items-center justify-between">
                <div className="flex space-x-1 space-x-reverse">
                  {(isPlayer1 ? round!.player1Answers : round!.player2Answers).slice(0, 3).map((ans, i) => {
                    const q = round!.questions[i];
                    const t = (isPlayer1 ? round!.player1Times : round!.player2Times)[i];
                    if (isAnswerPending(ans, t) || !q) return <div key={i} className="w-4 h-4 rounded-full bg-slate-600" />;
                    return <div key={i} className={cn("w-4 h-4 rounded-full", ans === q.correctOptionIndex ? "bg-green-500" : "bg-red-500")} />;
                  })}
                </div>
                <span className="text-white/70 text-xs">
                  {round!.category ? `${CATEGORIES[round!.category as keyof typeof CATEGORIES]?.icon} ${CATEGORIES[round!.category as keyof typeof CATEGORIES]?.label}` : 'دور ' + (idx + 1)}
                </span>
                <div className="flex space-x-1 space-x-reverse">
                  {(isPlayer1 ? round!.player2Answers : round!.player1Answers).slice(0, 3).map((ans, i) => {
                    const q = round!.questions[i];
                    const t = (isPlayer1 ? round!.player2Times : round!.player1Times)[i];
                    if (isAnswerPending(ans, t) || !q) return <div key={i} className="w-4 h-4 rounded-full bg-slate-600" />;
                    return <div key={i} className={cn("w-4 h-4 rounded-full", ans === q.correctOptionIndex ? "bg-green-500" : "bg-red-500")} />;
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="w-full max-w-xs space-y-3 pb-8">
            <button
              onClick={() => router.push('/game')}
              className="w-full bg-gradient-to-b from-[#87d235] to-[#73bc26] text-white font-black text-xl py-4 rounded-2xl shadow-[0_6px_0_#5da01f] active:translate-y-[6px] active:shadow-none transition-all border-2 border-[#b5e786]"
            >
              بازی جدید
            </button>
            <button
              onClick={() => router.push('/game')}
              className="w-full bg-[#114b82] text-white/70 font-bold py-3 rounded-2xl border border-white/20 hover:bg-[#185e98] transition-colors"
            >
              بازگشت به خانه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a6ebd] font-sans flex flex-col relative overflow-hidden">
      {/* Background question marks pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'10\' y=\'40\' font-family=\'Arial\' font-size=\'40\' fill=\'white\' font-weight=\'bold\'%3E?%3C/text%3E%3C/svg%3E")', backgroundSize: '60px 60px' }}></div>

      {/* Top Header */}
      <div className="bg-[#114b82] px-4 py-3 flex items-center justify-between text-white shadow-md relative z-10">
        <button onClick={() => router.push('/game')} className="p-1 active:scale-95"><ChevronRight size={28} /></button>
        <h1 className="text-xl font-bold font-sans tracking-wide">ویستا کوییز</h1>
        <div className="w-8" />
      </div>

      {/* Scoreboard Area */}
      <div className="relative z-10 px-4 pt-6 pb-2">
        <div className="flex justify-between items-start">
          {/* Me (Left Side) */}
          <div className="flex flex-col items-center relative">
            <div className="absolute -top-3 -right-3 z-20">
               <svg viewBox="0 0 24 24" fill="#78c02c" stroke="#5da01f" strokeWidth="1" className="w-8 h-8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
               <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mt-1">⭐</span>
            </div>
            <div 
              onClick={() => router.push(`/game/profile/${me.id}`)}
              className="w-16 h-16 rounded-full border-2 border-[#3ca2ea] overflow-hidden bg-white shadow-lg relative z-10 cursor-pointer hover:border-white transition-all active:scale-95"
            >
              <img src={me.avatarUrl} alt="Me" className="w-full h-full object-cover"/>
            </div>
            <span className="text-white text-xs font-bold mt-2 bg-[#114b82] px-3 py-1 rounded-full shadow-inner">{me.name}</span>
          </div>

          {/* Scores */}
          <div className="flex items-center space-x-4 space-x-reverse mt-4">
             <div className="bg-[#185e98] shadow-inner rounded-xl w-14 h-14 flex items-center justify-center border border-[#114b82]">
               <span className="text-3xl font-black text-white drop-shadow-md">{me.score}</span>
             </div>
             <div className="text-white/50 font-bold text-lg">:</div>
             <div className="bg-[#185e98] shadow-inner rounded-xl w-14 h-14 flex items-center justify-center border border-[#114b82]">
               <span className="text-3xl font-black text-white drop-shadow-md">{opponent ? opponent.score : 0}</span>
             </div>
          </div>

          {/* Opponent (Right Side) */}
          <div className="flex flex-col items-center relative">
            {opponent ? (
              <>
                <div className="absolute -top-3 -right-3 z-20">
                   <svg viewBox="0 0 24 24" fill="#78c02c" stroke="#5da01f" strokeWidth="1" className="w-8 h-8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                   <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mt-1">⭐</span>
                </div>
                <div 
                  onClick={() => router.push(`/game/profile/${opponent.id}`)}
                  className="w-16 h-16 rounded-full border-2 border-[#3ca2ea] overflow-hidden bg-white shadow-lg relative z-10 cursor-pointer hover:border-white transition-all active:scale-95"
                >
                  <img src={opponent.avatarUrl} alt="Opponent" className="w-full h-full object-cover"/>
                </div>
                <span className="text-white text-xs font-bold mt-2 bg-[#114b82] px-3 py-1 rounded-full shadow-inner">{opponent.name}</span>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#3ca2ea] bg-black/10 flex items-center justify-center text-white/50 shadow-inner relative z-10">
                  ?
                </div>
                <span className="text-white/50 text-[10px] font-bold mt-2">در انتظار حریف</span>
              </>
            )}
          </div>
        </div>

        {/* Round progress indicator */}
        <div className="mt-4 flex justify-center space-x-1.5 space-x-reverse">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i < match.currentRoundIndex ? "bg-[#78c02c] w-6" :
              i === match.currentRoundIndex && match.status === 'in_progress' ? "bg-white w-8 animate-pulse" :
              "bg-white/20 w-4"
            )} />
          ))}
        </div>
        <p className="text-center text-white/60 text-xs mt-1 font-medium">دور {match.currentRoundIndex + 1} از {totalRounds}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/20 relative z-10 mx-2 mt-4">
         <div className="flex-1 py-3 text-center border-b-2 border-white text-white font-bold text-sm">مسابقه</div>
         <div className="flex-1 py-3 text-center text-white/50 font-bold text-sm">گفت‌وگو</div>
      </div>

      {/* Rounds List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative z-10 pb-28">
        {rounds.map((round, idx) => {
          const isCurrentRound = match.status === 'in_progress' && match.currentRoundIndex === idx;
          const hasPlayed = round !== null;

          if (!hasPlayed && !isCurrentRound) {
            return (
              <div key={idx} className="h-14 bg-[#145d9c] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-[#114b82] w-full flex opacity-40">
                 <div className="flex-1 border-l border-black/10"></div>
                 <div className="w-24 border-l border-black/10"></div>
                 <div className="flex-1"></div>
              </div>
            );
          }

          if (isCurrentRound && round) {
            const myTurn = isPlayerTurn(match, currentUserId, round);
            const catId = round.category as keyof typeof CATEGORIES | undefined;
            return (
              <div key={idx} className="h-14 bg-[#186caf] rounded-full shadow-md w-full flex items-center justify-between px-1 border border-[#2482cc]">
                <div className="flex-1 flex justify-center items-center">
                  {myTurn ? <span className="text-white text-sm font-bold drop-shadow-sm animate-pulse">نوبت توئه ▶</span> : null}
                </div>
                <div className="w-28 h-12 bg-[#0e4f8a] rounded-full flex items-center justify-center px-2 text-white font-bold text-xs shadow-inner">
                  {catId && CATEGORIES[catId] ? (
                    <span className="flex items-center space-x-1 space-x-reverse text-[10px]">
                      <span className="ml-1 text-base">{CATEGORIES[catId].icon}</span>
                      {CATEGORIES[catId].label}
                    </span>
                  ) : 'انتخاب موضوع'}
                </div>
                <div className="flex-1 flex justify-center items-center">
                  {!myTurn ? (
                    <div className="bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                      نوبت حریف
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }

          if (hasPlayed && round) {
             const myAnswers = isPlayer1 ? round.player1Answers : round.player2Answers;
             const oppAnswers = isPlayer1 ? round.player2Answers : round.player1Answers;
             const myTimes = isPlayer1 ? round.player1Times : round.player2Times;
             const oppTimes = isPlayer1 ? round.player2Times : round.player1Times;
             const catId = round.category as keyof typeof CATEGORIES | undefined;

             const renderCircles = (answers: number[], times: number[]) => {
               const circles = [];
               for (let i = 0; i < 3; i++) {
                 const ans = answers[i];
                 const time = times[i];
                 const question = round.questions[i];
                 if (!isAnswerPending(ans, time) && question && ans === question.correctOptionIndex) circles.push(<div key={i} className="w-5 h-5 rounded-full bg-[#78c02c] shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"></div>);
                 else if (!isAnswerPending(ans, time) && question) circles.push(<div key={i} className="w-5 h-5 rounded-full bg-[#ea4b34] shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"></div>);
                 else circles.push(<div key={i} className="w-5 h-5 rounded-full bg-[#114b82] shadow-inner"></div>);
               }
               return circles;
             };

             return (
              <div key={idx} className="h-14 bg-[#145d9c] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-[#114b82] w-full flex items-center justify-between px-3">
                <div className="flex-1 flex justify-start items-center space-x-1.5 space-x-reverse">
                  {renderCircles(myAnswers, myTimes)}
                </div>
                <div className="w-24 flex items-center justify-center text-white font-bold text-[10px]">
                  {catId && CATEGORIES[catId] ? (
                    <span className="flex items-center space-x-1 space-x-reverse">
                      <span className="ml-1 text-base">{CATEGORIES[catId].icon}</span>
                      {CATEGORIES[catId].label}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 flex justify-end items-center space-x-1.5 space-x-reverse">
                  {renderCircles(oppAnswers, oppTimes)}
                </div>
              </div>
             );
          }
        })}
      </div>

      {/* Sticky Bottom Play Button */}
      <div className="fixed bottom-6 left-0 right-0 md:right-[220px] px-6 z-50">
        <button
          onClick={() => router.push(`/game/play/${matchId}`)}
          disabled={!canPlay}
          className={cn(
            "w-full rounded-2xl py-4 flex items-center justify-center space-x-2 space-x-reverse transition-all font-black text-2xl relative shadow-lg",
            canPlay
            ? "bg-gradient-to-b from-[#87d235] to-[#73bc26] text-white border-b-4 border-[#5da01f] active:translate-y-[4px] active:border-b-0"
            : "bg-[#114b82] text-white/30 border-b-4 border-[#0a2e50]"
          )}
        >
          <span>{canPlay ? 'بازی کن' : isWaitingForOpponent ? 'منتظر حریف' : 'نوبت حریفه'}</span>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
    </div>
  );
}
