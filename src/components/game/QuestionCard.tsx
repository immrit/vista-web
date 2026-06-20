import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Category, Question, CATEGORIES } from '@/lib/game/questions';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Pause, Percent, Bomb } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  category: Category;
  myScore: number;
  opponentScore: number;
  onAnswer: (answerIndex: number, timeTakenMs: number) => void;
  timeLimitMs?: number;
}

export function QuestionCard({ question, category, myScore, opponentScore, onAnswer, timeLimitMs = 10000 }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimitMs);
  const startTime = useRef(Date.now());
  const submittedRef = useRef(false);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAnswerRef = useRef(onAnswer);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  const clearSubmitTimeout = useCallback(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
  }, []);

  const commitAnswer = useCallback((index: number, delayMs: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSelectedAnswer(index);
    const timeTaken = Math.min(timeLimitMs, Math.max(0, Date.now() - startTime.current));
    clearSubmitTimeout();
    submitTimeoutRef.current = setTimeout(() => {
      submitTimeoutRef.current = null;
      onAnswerRef.current(index, timeTaken);
    }, delayMs);
  }, [clearSubmitTimeout, timeLimitMs]);

  useEffect(() => {
    clearSubmitTimeout();
    submittedRef.current = false;
    setSelectedAnswer(null);
    setTimeLeft(timeLimitMs);
    startTime.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        commitAnswer(-1, 0);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      clearSubmitTimeout();
    };
  }, [clearSubmitTimeout, commitAnswer, question.id, timeLimitMs]);

  const handleAnswer = (index: number) => {
    commitAnswer(index, 1500);
  };

  const progressPercent = (timeLeft / timeLimitMs) * 100;

  return (
    <div className="w-full max-w-md flex flex-col h-full animate-in fade-in duration-500">

      {/* Top Scores */}
      <div className="flex items-center justify-center space-x-6 space-x-reverse text-white mb-6 font-bold text-sm drop-shadow">
        <span>امتیاز حریف</span>
        <span>{opponentScore}</span>
        <span>-</span>
        <span>{myScore}</span>
        <span>امتیاز شما</span>
      </div>

      {/* White Question Card */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-[2rem] pt-8 pb-6 px-6 relative shadow-lg mb-4 flex-1 flex flex-col items-center justify-center min-h-[200px]">
          {/* Category Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#7c3aed] text-white px-6 py-1.5 rounded-full font-bold text-sm shadow-md">
            {CATEGORIES[category].label}
          </div>

          <h3 className="text-xl md:text-2xl font-black text-center text-slate-800 leading-relaxed mb-4">
            {question.text}
          </h3>

          <div className="mt-auto opacity-10 font-black text-5xl tracking-widest uppercase">
            VISTA
          </div>

          <div className="absolute bottom-4 bg-slate-300 text-slate-600 px-6 py-1 rounded-full text-xs font-bold shadow-inner">
            طراح سوال: <span className="text-[#7c3aed]">{question.authorName || 'ویستا'}</span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center space-x-2 space-x-reverse mb-6">
          <button disabled title="به زودی" className="bg-[#4c1d95]/60 border border-[#7c3aed] shadow-[0_4px_0_#3b0764] rounded-xl p-2 flex flex-col items-center justify-center w-14 h-14 cursor-not-allowed opacity-70">
            <Pause className="text-yellow-300 fill-yellow-300" size={20} />
            <div className="flex items-center mt-1 text-white text-[10px] font-bold">
              ۳۰ <div className="relative w-3 h-3 mr-0.5"><Image src="/images/coin.png" alt="coin" fill /></div>
            </div>
          </button>

          <div className="flex-1 bg-[#3b0764] h-8 rounded-full border border-[#4c1d95] p-1 shadow-inner relative overflow-hidden">
            <div
              className="h-full bg-[#a855f7] rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctOptionIndex;
            const isWrongSelected = isSelected && !isCorrect;
            const showCorrect = selectedAnswer !== null && isCorrect;

            let btnClass = "bg-white text-slate-800 shadow-[0_4px_0_#cbd5e1] active:translate-y-1 active:shadow-none";
            if (showCorrect) {
              btnClass = "bg-[#78c02c] text-white shadow-[0_4px_0_#5da01f] scale-[1.02] z-10 font-black";
            } else if (isWrongSelected) {
              btnClass = "bg-[#e61a4b] text-white shadow-[0_4px_0_#b3153b] font-black";
            } else if (selectedAnswer !== null) {
              btnClass = "bg-slate-100 text-slate-400 shadow-none translate-y-1 opacity-70";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={cn(
                  "p-4 rounded-[1.5rem] font-bold text-sm md:text-base transition-all duration-200 flex items-center justify-center min-h-[80px]",
                  btnClass
                )}
              >
                <span className="text-center">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Lifelines */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <button disabled title="به زودی" className="bg-[#78c02c]/70 border border-[#a2e858] shadow-[0_4px_0_#5da01f] rounded-2xl p-2 flex flex-col items-center justify-center space-y-1 cursor-not-allowed opacity-70">
            <Percent className="text-purple-600" size={24} />
            <span className="text-[10px] font-bold text-slate-800">جواب‌های مردم</span>
            <div className="flex items-center text-white text-[10px] font-bold bg-[#68a825] px-2 py-0.5 rounded-full w-full justify-center">
              ۶۰ <div className="relative w-3 h-3 mr-0.5"><Image src="/images/coin.png" alt="coin" fill /></div>
            </div>
          </button>

          <button disabled title="به زودی" className="bg-[#78c02c]/70 border border-[#a2e858] shadow-[0_4px_0_#5da01f] rounded-2xl p-2 flex flex-col items-center justify-center space-y-1 cursor-not-allowed opacity-70">
            <Bomb className="text-slate-800 fill-slate-800" size={24} />
            <span className="text-[10px] font-bold text-slate-800">حذف دو گزینه</span>
            <div className="flex items-center text-white text-[10px] font-bold bg-[#68a825] px-2 py-0.5 rounded-full w-full justify-center">
              ۴۰ <div className="relative w-3 h-3 mr-0.5"><Image src="/images/coin.png" alt="coin" fill /></div>
            </div>
          </button>

          <button disabled title="به زودی" className="bg-[#78c02c]/70 border border-[#a2e858] shadow-[0_4px_0_#5da01f] rounded-2xl p-2 flex flex-col items-center justify-center space-y-1 cursor-not-allowed opacity-70">
            <div className="font-black text-xl text-yellow-300 drop-shadow-md">۲x</div>
            <span className="text-[10px] font-bold text-slate-800">شانس مجدد</span>
            <div className="flex items-center text-white text-[10px] font-bold bg-[#68a825] px-2 py-0.5 rounded-full w-full justify-center">
              ۴۰ <div className="relative w-3 h-3 mr-0.5"><Image src="/images/coin.png" alt="coin" fill /></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
