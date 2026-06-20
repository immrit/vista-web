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

  const myAnswers = isPlayer1 ? currentRound?.player1Answers : currentRound?.player2Answers;
  const myTimes = isPlayer1 ? currentRound?.player1Times : currentRound?.player2Times;
  const questions = currentRound?.questions || [];

  const statusLabel = match.status === 'finished'
    ? 'بازی تمام شده'
    : isWaitingForOpponent
      ? 'منتظر حریف'
      : isMyTurn
        ? 'نوبت شماست'
        : 'نوبت حریف';

  return (
    <div
      onClick={openMatch}
      className={cn(
        'relative w-full rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.98]',
        'bg-white/5 border',
        isMyTurn
          ? 'border-emerald-500/40 hover:border-emerald-500/60 hover:bg-emerald-500/5'
          : 'border-white/10 hover:border-violet-500/30 hover:bg-white/8'
      )}
    >
      {isMyTurn && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent rounded-t-2xl" />
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className={cn(
              'w-12 h-12 rounded-xl overflow-hidden border-2',
              isMyTurn ? 'border-emerald-400/70' : 'border-white/15'
            )}>
              {opponent ? (
                <img src={getRenderableAvatarUrl(opponent.avatarUrl)} alt={opponent.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30 text-lg font-black">?</div>
              )}
            </div>
            {isMyTurn && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0c1e] animate-pulse" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm truncate">{opponent ? opponent.name : 'منتظر ورود حریف...'}</span>
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block w-max border',
              match.status === 'finished'
                ? 'bg-white/5 text-white/30 border-white/10'
                : isMyTurn
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isWaitingForOpponent
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-white/8 text-white/50 border-white/10'
            )}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-white/30 text-[10px] font-bold">دور {match.currentRoundIndex + 1}</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((idx) => {
              const answer = myAnswers ? myAnswers[idx] : undefined;
              const question = questions[idx];

              let cls = 'bg-white/10';
              if (!isAnswerPending(answer, myTimes?.[idx]) && question) {
                cls = answer === question.correctOptionIndex ? 'bg-emerald-500' : 'bg-rose-500';
              }

              return <div key={idx} className={cn('w-3 h-3 rounded-full', cls)} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
