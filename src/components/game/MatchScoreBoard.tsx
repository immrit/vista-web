import React from 'react';
import { PlayerState, MatchState } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MatchScoreBoardProps {
  match: MatchState;
  currentPlayerId: string;
}

export function MatchScoreBoard({ match, currentPlayerId }: MatchScoreBoardProps) {
  const isPlayer1 = match.player1.id === currentPlayerId;
  const me = isPlayer1 ? match.player1 : match.player2!;
  const opponent = isPlayer1 ? match.player2! : match.player1;

  // Total possible rounds
  const totalRounds = 4; // Should match MAX_ROUNDS in backend

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-6 shadow-xl border-b-8 border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between mb-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/20 via-pink-200/20 to-rose-200/20 rounded-[2.5rem] pointer-events-none"></div>
      
      {/* Me */}
      <div className="flex items-center space-x-4 space-x-reverse z-10">
        <div className="relative animate-bounce-slow">
          <div className="w-20 h-20 rounded-full overflow-hidden border-[6px] border-indigo-400 bg-white shadow-[0_4px_15px_rgba(99,102,241,0.5)]">
            <Image src={me.avatarUrl} alt={me.name} width={80} height={80} className="object-cover bg-indigo-50" />
          </div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-white shadow-md">
            شما
          </div>
        </div>
        <div className="flex flex-col items-start bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-2xl shadow-inner border border-white/50">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{me.name}</span>
          <span className="font-black text-4xl text-indigo-600 dark:text-indigo-400 drop-shadow-sm">{me.score}</span>
        </div>
      </div>

      {/* Center status (Rounds) */}
      <div className="flex flex-col items-center justify-center px-4 z-10">
        <span className="text-xs font-black text-indigo-800/50 dark:text-indigo-200/50 uppercase tracking-widest mb-3 bg-white/50 px-3 py-1 rounded-full">Round</span>
        <div className="flex space-x-3 space-x-reverse">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-500 border-2 border-white/50",
                i < match.currentRoundIndex ? "bg-gradient-to-b from-indigo-400 to-indigo-600 shadow-inner" : 
                i === match.currentRoundIndex ? "bg-gradient-to-b from-amber-300 to-amber-500 scale-150 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse border-white" : "bg-slate-300/50 dark:bg-slate-700/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Opponent */}
      <div className="flex items-center space-x-4 space-x-reverse text-left flex-row-reverse z-10">
        <div className="relative ml-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-[6px] border-rose-400 bg-white shadow-[0_4px_15px_rgba(244,63,94,0.5)]">
            <Image src={opponent.avatarUrl} alt={opponent.name} width={80} height={80} className="object-cover bg-rose-50" />
          </div>
        </div>
        <div className="flex flex-col items-end bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-2xl shadow-inner border border-white/50">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{opponent.name}</span>
          <span className="font-black text-4xl text-rose-600 dark:text-rose-400 drop-shadow-sm">{opponent.score}</span>
        </div>
      </div>
    </div>
  );
}
