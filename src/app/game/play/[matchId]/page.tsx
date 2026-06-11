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
      if (data) {
        setMatch(data);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'match not found' || err.status === 403 || err.status === 404) {
        router.push('/game');
      }
    }
  }, [matchId, router]);

  useEffect(() => {
    if (!loading && !playerId) {
      router.push('/game');
    }
  }, [loading, playerId, router]);

  useEffect(() => {
    if (loading || !matchId || !playerId) return;

    setRandomCats(getRandomCategories(4));

    fetchMatch();
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [fetchMatch, loading, matchId, playerId]);

  if (!match || !playerId || loading) {
    return (
      <div className="min-h-screen bg-[#1a6ebd] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  const isPlayer1 = match.player1.id === playerId;
  const opponent = isPlayer1 ? match.player2 : match.player1;

  const currentRound = getCurrentRound(match);
  if (!currentRound) {
    return (
      <div className="min-h-screen bg-[#1a6ebd] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  const isWaitingForOpponent = match.status === 'waiting' || match.status === 'waiting_for_opponent' || !match.player2;
  const isMyTurn = isPlayerTurn(match, playerId, currentRound);

  if (match.status === 'finished') {
    router.replace(`/game/match/${matchId}`);
    return <div className="min-h-screen bg-[#1a6ebd] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>;
  }

  if (isWaitingForOpponent) {
    return (
      <div className="min-h-screen bg-[#1a6ebd] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        <p className="font-bold text-white text-xl shadow-text">در انتظار ورود حریف...</p>
        <p className="text-white/70 text-sm">لینک بازی را برای دوستتان ارسال کنید</p>
        <button
          onClick={() => router.push(`/game/match/${matchId}`)}
          className="mt-4 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold backdrop-blur-sm border border-white/20 transition-colors"
        >
          بازگشت به صفحه بازی
        </button>
      </div>
    );
  }

  const handlePickCategory = async (category: Category) => {
    setLoadingAction(true);
    try {
      const updatedMatch = await apiClient.post<MatchState>(`/v1/game/match/${matchId}/action`, {
        action: 'pick_category', 
        payload: { category } 
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
        payload: { questionIndex: qIndex, answerIndex, timeTakenMs }
      });
      if (updatedMatch) {
        setMatch(updatedMatch);
        const answeredRound = updatedMatch.rounds.find((round) => round.roundIndex === answeredRoundIndex) || null;
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
  
  // Find which question we are on
  const questionIndex = getNextQuestionIndex(myAnswers, myTimes);
  const questions = currentRound.questions || [];
  const currentQuestion = questionIndex !== -1 && questionIndex < questions.length ? questions[questionIndex] : null;

  return (
    <div className="min-h-screen bg-[#1a6ebd] font-sans flex flex-col relative overflow-hidden pb-10">
      {/* Background question marks pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'10\' y=\'40\' font-family=\'Arial\' font-size=\'40\' fill=\'white\' font-weight=\'bold\'%3E?%3C/text%3E%3C/svg%3E")', backgroundSize: '60px 60px' }}></div>

      <div className="flex-1 w-full flex flex-col items-center pt-8 px-4 relative z-10">
        
        {!isMyTurn ? (
          <div className="flex flex-col items-center justify-center flex-1 space-y-6">
            <div className="w-24 h-24 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
            <h2 className="text-2xl font-black text-white shadow-text text-center leading-relaxed">
              {currentRound.status === 'picking_category' ? 'منتظر انتخاب موضوع حریف باش...' : <>منتظر پاسخ <span className="text-amber-300">{opponent?.name || 'حریف'}</span> باش...</>}
            </h2>
            <button 
              onClick={() => router.push(`/game/match/${matchId}`)}
              className="mt-8 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold backdrop-blur-sm border border-white/20 transition-colors"
            >
              بازگشت به لابی
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
          <div className="flex flex-col items-center justify-center flex-1 space-y-6">
            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-12 h-12">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white shadow-text text-center">
              راند شما به پایان رسید!
            </h2>
            <button 
              onClick={() => router.push(`/game/match/${matchId}`)}
              className="mt-8 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold backdrop-blur-sm border border-white/20 transition-colors"
            >
              مشاهده نتیجه
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
