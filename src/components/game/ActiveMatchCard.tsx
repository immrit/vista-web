import React from 'react';
import { MatchState } from '@/lib/game/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getCurrentRound, isAnswerPending, isPlayerTurn } from '@/lib/game/state';

interface ActiveMatchCardProps {
  match: MatchState;
  currentPlayerId: string;
}

function getRenderableAvatarUrl(avatarUrl: string) {
  if (avatarUrl.startsWith('https://api.dicebear.com/') && avatarUrl.includes('/svg')) {
    return avatarUrl.replace('/svg', '/png');
  }
  return avatarUrl;
}

export function ActiveMatchCard({ match, currentPlayerId }: ActiveMatchCardProps) {
  const router = useRouter();
  
  const isPlayer1 = match.player1.id === currentPlayerId;
  const opponent = isPlayer1 ? match.player2 : match.player1;
  
  // Find whose turn it is
  const currentRound = getCurrentRound(match);
  let isMyTurn = isPlayerTurn(match, currentPlayerId, currentRound);
  let isWaitingForOpponent = match.status === 'waiting' || match.status === 'waiting_for_opponent' || !match.player2;
  
  if (match.status === 'finished') {
    isMyTurn = false;
    isWaitingForOpponent = false;
  }

  const openMatch = () => {
    router.push(isMyTurn ? `/game/play/${match.matchId}` : `/game/match/${match.matchId}${isWaitingForOpponent ? '?auto=1' : ''}`);
  };

  // Get the answers for the latest played/playing round to show circles
  // If we haven't played the current round yet, but opponent has, we show the current round's answers for opponent.
  // Actually, standard is to show your own answers.
  const myAnswers = isPlayer1 ? currentRound?.player1Answers : currentRound?.player2Answers;
  const myTimes = isPlayer1 ? currentRound?.player1Times : currentRound?.player2Times;
  const questions = currentRound?.questions || [];

  return (
    <div 
      onClick={openMatch}
      className="relative w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 shadow-md border-b-4 border-slate-200 dark:border-slate-800 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <div className={cn(
              "w-16 h-16 rounded-full overflow-hidden border-[4px]",
              isMyTurn ? "border-emerald-400" : "border-slate-300 dark:border-slate-600"
            )}>
              {opponent ? (
                <img src={getRenderableAvatarUrl(opponent.avatarUrl)} alt={opponent.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <span className="text-2xl text-slate-400">?</span>
                </div>
              )}
            </div>
            {isMyTurn && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            )}
          </div>
          
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {opponent ? opponent.name : 'منتظر ورود حریف...'}
            </span>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block w-max",
              match.status === 'finished' ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
              isMyTurn ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : 
              "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
            )}>
              {match.status === 'finished' ? 'بازی تمام شده' : isWaitingForOpponent ? 'منتظر حریف' : isMyTurn ? 'نوبت شماست' : 'نوبت حریف است'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 mb-1 font-bold">راند {match.currentRoundIndex + 1}</span>
          <div className="flex space-x-1 space-x-reverse">
            {[0, 1, 2].map((idx) => {
              const answer = myAnswers ? myAnswers[idx] : -1;
              const question = questions[idx];
              
              let bgColor = "bg-slate-200 dark:bg-slate-700";
              if (!isAnswerPending(answer, myTimes?.[idx]) && question) {
                if (answer === question.correctOptionIndex) {
                  bgColor = "bg-emerald-500";
                } else {
                  bgColor = "bg-rose-500";
                }
              }

              return (
                <div 
                  key={idx}
                  className={cn("w-4 h-4 rounded-full border border-white/50", bgColor)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
