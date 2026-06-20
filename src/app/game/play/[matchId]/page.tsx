"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MatchState } from '@/lib/game/types';
import { CategorySelector } from '@/components/game/CategorySelector';
import { QuestionCard } from '@/components/game/QuestionCard';
import { getRandomCategories, Category } from '@/lib/game/questions';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentRound, getNextQuestionIndex, hasPlayerCompletedRound, isPlayerTurn } from '@/lib/game/state';
import { getAuthPlayerCandidates, resolveMatchPlayerId } from '@/lib/game/player';

export default function PlayMatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [match, setMatch] = useState<MatchState | null>(null);
  const [randomCats, setRandomCats] = useState<Category[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const playerIdCandidates = getAuthPlayerCandidates(user?.id, profile?.id, profile?.user_id);
  const playerId = resolveMatchPlayerId(match, playerIdCandidates);

  const fetchMatch = useCallback(async () => {
    try {
      const data = await apiClient.get<MatchState>(`/v1/game/match/${matchId}`);
      if (data) setMatch(data);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'match not found' || err.status === 403 || err.status === 404) {
        router.push('/game');
      }
    }
  }, [matchId, router]);

  useEffect(() => {
    if (!loading && !playerId) router.push('/game');
  }, [loading, playerId, router]);

  useEffect(() => {
    if (loading || !matchId || !playerId) return;
    setRandomCats(getRandomCategories(4));
    fetchMatch();
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [fetchMatch, loading, matchId, playerId]);

  const GameLoader = () => (
    <div className="min-h-screen bg-[#0d0c1e] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );

  if (!match || !playerId || loading) return <GameLoader />;

  const isPlayer1 = match.player1.id === playerId;
  const opponent = isPlayer1 ? match.player2 : match.player1;

  const currentRound = getCurrentRound(match);
  if (!currentRound) return <GameLoader />;

  const isWaitingForOpponent = match.status === 'waiting' || match.status === 'waiting_for_opponent' || !match.player2;
  const isMyTurn = isPlayerTurn(match, playerId, currentRound);

  if (match.status === 'finished') {
    router.replace(`/game/match/${matchId}`);
    return <GameLoader />;
  }

  if (isWaitingForOpponent) {
    return (
      <div className="min-h-screen bg-[#0d0c1e] relative overflow-hidden flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <div>
            <p className="font-black text-white text-xl">در انتظار حریف...</p>
            <p className="text-white/40 text-sm mt-2">لینک بازی را برای دوستتان ارسال کنید</p>
          </div>
          <button
            onClick={() => router.push(`/game/match/${matchId}`)}
            className="bg-white/8 border border-white/10 hover:bg-white/15 text-white/70 px-8 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            بازگشت به صفحه بازی
          </button>
        </div>
      </div>
    );
  }

  const handlePickCategory = async (category: Category) => {
    setLoadingAction(true);
    try {
      const updatedMatch = await apiClient.post<MatchState>(`/v1/game/match/${matchId}/action`, {
        action: 'pick_category',
        payload: { category },
      });
      if (updatedMatch) setMatch(updatedMatch);
    } catch (err: any) {
      console.error(err);
      alert('خطا در انتخاب موضوع: ' + (err.message || 'نامشخص'));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAnswer = async (answerIndex: number, timeTakenMs: number, qIndex: number) => {
    const answeredRoundIndex = currentRound.roundIndex;
    setLoadingAction(true);
    try {
      const updatedMatch = await apiClient.post<MatchState>(`/v1/game/match/${matchId}/action`, {
        action: 'submit_answer',
        payload: { questionIndex: qIndex, answerIndex, timeTakenMs },
      });
      if (updatedMatch) {
        setMatch(updatedMatch);
        const answeredRound = updatedMatch.rounds.find((r) => r.roundIndex === answeredRoundIndex) || null;
        if (hasPlayerCompletedRound(updatedMatch, playerId, answeredRound)) {
          router.replace(`/game/match/${matchId}`);
          return;
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('خطا در ثبت پاسخ: ' + (err.message || 'نامشخص'));
    } finally {
      setLoadingAction(false);
    }
  };

  const myAnswers = (isPlayer1 ? currentRound.player1Answers : currentRound.player2Answers) || [];
  const myTimes = (isPlayer1 ? currentRound.player1Times : currentRound.player2Times) || [];
  const questionIndex = getNextQuestionIndex(myAnswers, myTimes);
  const questions = currentRound.questions || [];
  const currentQuestion = questionIndex !== -1 && questionIndex < questions.length ? questions[questionIndex] : null;

  return (
    <div className="min-h-screen bg-[#0d0c1e] font-sans flex flex-col relative overflow-hidden pb-10">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="flex-1 w-full flex flex-col items-center pt-8 px-4 relative z-10">
        {!isMyTurn ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-6">
            <div className="w-20 h-20 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            <div className="text-center">
              <h2 className="text-xl font-black text-white">
                {currentRound.status === 'picking_category'
                  ? 'منتظر انتخاب موضوع حریف...'
                  : <>منتظر پاسخ <span className="text-cyan-400">{opponent?.name || 'حریف'}</span>...</>
                }
              </h2>
              <p className="text-white/40 text-sm mt-2">لحظه‌ای صبر کنید</p>
            </div>
            <button
              onClick={() => router.push(`/game/match/${matchId}`)}
              className="bg-white/8 border border-white/10 hover:bg-white/15 text-white/60 px-8 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              بازگشت به صفحه بازی
            </button>
          </div>
        ) : currentRound.status === 'picking_category' ? (
          <CategorySelector
            categories={randomCats}
            onSelect={(cat) => handlePickCategory(cat)}
            disabled={loadingAction}
            opponentName={opponent?.name || 'حریف'}
          />
        ) : currentRound.status === 'playing' && currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            category={currentRound.category!}
            myScore={isPlayer1 ? match.player1.score : match.player2?.score || 0}
            opponentScore={!isPlayer1 ? match.player1.score : match.player2?.score || 0}
            onAnswer={(idx, time) => handleAnswer(idx, time, questionIndex)}
            timeLimitMs={10000}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-6">
            <div className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500/50 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10 text-emerald-400">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">راند شما تمام شد!</h2>
              <p className="text-white/40 text-sm mt-1">در حال انتقال...</p>
            </div>
            <button
              onClick={() => router.push(`/game/match/${matchId}`)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-violet-500/25"
            >
              مشاهده نتیجه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
