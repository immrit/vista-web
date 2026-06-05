"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { MatchState } from '@/lib/game/types';
import { MatchScoreBoard } from '@/components/game/MatchScoreBoard';
import { CategorySelector } from '@/components/game/CategorySelector';
import { QuestionCard } from '@/components/game/QuestionCard';
import { getRandomCategories, Category } from '@/lib/game/questions';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

export default function PlayMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const { profile } = useAuth();
  const playerId = profile?.id;
  const router = useRouter();

  const [match, setMatch] = useState<MatchState | null>(null);
  const [randomCats, setRandomCats] = useState<Category[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (!playerId) {
      router.push('/game');
      return;
    }

    setRandomCats(getRandomCategories(3));

    const fetchMatch = async () => {
      try {
        const data = await apiClient.get<MatchState>(`/v1/game/match/${matchId}`);
        if (data) {
          setMatch(data);
        }
      } catch (err: any) {
        console.error(err);
        if (err.message === 'match not found' || err.message.includes('404')) {
          router.push('/game');
        }
      }
    };

    fetchMatch();
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [matchId, playerId, router]);

  if (!match || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const handlePickCategory = async (category: Category) => {
    setLoadingAction(true);
    await apiClient.post(`/v1/game/match/${matchId}/action`, {
      action: 'pick_category', 
      payload: { category } 
    });
    setLoadingAction(false);
  };

  const handleAnswer = async (answerIndex: number, timeTakenMs: number) => {
    setLoadingAction(true);
    await apiClient.post(`/v1/game/match/${matchId}/action`, {
      action: 'submit_answer', 
      payload: { questionIndex, answerIndex, timeTakenMs } 
    });
    setLoadingAction(false);
  };

  const currentRound = match.rounds[match.currentRoundIndex];
  const isMyTurn = currentRound.turnPlayerId === playerId;
  const isPlayer1 = match.player1.id === playerId;
  const myAnswers = isPlayer1 ? currentRound.player1Answers : currentRound.player2Answers;
  
  // Find which question we are on
  const questionIndex = myAnswers.findIndex(a => a === -1);
  const currentQuestion = questionIndex !== -1 ? currentRound.questions[questionIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-pink-50 to-indigo-100 dark:from-indigo-950 dark:via-purple-900 dark:to-slate-900 p-4 md:p-8 font-sans flex flex-col items-center">
      <MatchScoreBoard match={match} currentPlayerId={playerId} />

      <div className="flex-1 w-full flex flex-col items-center justify-center mt-8">
        
        {match.status === 'finished' && (
          <div className="text-center space-y-8 animate-in zoom-in duration-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-4 border-white/50">
            <h2 className="text-5xl font-black text-slate-800 dark:text-white drop-shadow-sm">بازی تمام شد!</h2>
            <div className="py-6">
              {match.winnerId === playerId ? (
                <div className="animate-bounce-short space-y-4">
                  <p className="text-7xl">🏆</p>
                  <p className="text-3xl text-emerald-500 font-black drop-shadow-sm">شما برنده شدید!</p>
                  <p className="text-lg font-bold text-emerald-600 bg-emerald-100 inline-block px-4 py-1 rounded-full">+۱۰۰ سکه</p>
                </div>
              ) : match.winnerId === 'tie' ? (
                <div className="animate-pulse space-y-4">
                  <p className="text-7xl">🤝</p>
                  <p className="text-3xl text-amber-500 font-black drop-shadow-sm">بازی مساوی شد!</p>
                  <p className="text-lg font-bold text-amber-600 bg-amber-100 inline-block px-4 py-1 rounded-full">+۵۰ سکه برگشت داده شد</p>
                </div>
              ) : (
                <div className="animate-wobble space-y-4">
                  <p className="text-7xl">😔</p>
                  <p className="text-3xl text-rose-500 font-black drop-shadow-sm">شما باختید!</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => router.push('/game')}
              className="px-10 py-4 bg-gradient-to-b from-indigo-500 to-indigo-600 border-b-[6px] border-indigo-800 active:border-b-0 active:translate-y-[6px] text-white rounded-[2rem] font-black text-xl hover:from-indigo-400 hover:to-indigo-500 transition-all shadow-md w-full max-w-xs"
            >
              بازی جدید
            </button>
          </div>
        )}

        {match.status === 'in_progress' && (
          <>
            {currentRound.status === 'picking_category' && isMyTurn && (
              <CategorySelector 
                categories={randomCats} 
                onSelect={handlePickCategory} 
                disabled={loadingAction}
              />
            )}

            {currentRound.status === 'picking_category' && !isMyTurn && (
              <div className="text-center animate-pulse bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-[2rem] border-2 border-white/50 shadow-md">
                <div className="text-6xl mb-4">🤔</div>
                <p className="text-2xl text-slate-700 dark:text-slate-300 font-black">
                  در انتظار حریف برای انتخاب دسته‌بندی...
                </p>
              </div>
            )}

            {currentRound.status === 'playing' && isMyTurn && currentQuestion && (
              <div className="w-full flex flex-col items-center">
                <div className="mb-4 bg-white/80 dark:bg-slate-900/80 px-6 py-2 rounded-full border-2 border-indigo-200 dark:border-indigo-800 shadow-sm text-indigo-700 dark:text-indigo-400 font-black text-xl">
                  سوال {questionIndex + 1} از 3
                </div>
                <QuestionCard 
                  key={currentQuestion.id} // force re-render/reset timer when question changes
                  question={currentQuestion} 
                  onAnswer={handleAnswer} 
                />
              </div>
            )}

            {currentRound.status === 'playing' && !isMyTurn && (
               <div className="text-center animate-pulse bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-[2rem] border-2 border-white/50 shadow-md">
                 <div className="text-6xl mb-4">⏳</div>
                 <p className="text-2xl text-slate-700 dark:text-slate-300 font-black">
                   حریف در حال پاسخگویی است...
                 </p>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
