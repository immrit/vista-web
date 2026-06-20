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

const OPTION_COLORS = [
  { base: 'bg-violet-600/20 border-violet-500/40 text-white', correct: 'bg-emerald-500 border-emerald-400 text-white', wrong: 'bg-rose-500 border-rose-400 text-white', dim: 'bg-white/5 border-white/10 text-white/30' },
  { base: 'bg-cyan-600/20 border-cyan-500/40 text-white', correct: 'bg-emerald-500 border-emerald-400 text-white', wrong: 'bg-rose-500 border-rose-400 text-white', dim: 'bg-white/5 border-white/10 text-white/30' },
  { base: 'bg-amber-600/20 border-amber-500/40 text-white', correct: 'bg-emerald-500 border-emerald-400 text-white', wrong: 'bg-rose-500 border-rose-400 text-white', dim: 'bg-white/5 border-white/10 text-white/30' },
  { base: 'bg-rose-600/20 border-rose-500/40 text-white', correct: 'bg-emerald-500 border-emerald-400 text-white', wrong: 'bg-rose-500 border-rose-400 text-white', dim: 'bg-white/5 border-white/10 text-white/30' },
];

export function QuestionCard({ question, category, myScore, opponentScore, onAnswer, timeLimitMs = 10000 }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimitMs);
  const startTime = useRef(Date.now());
  const submittedRef = useRef(false);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAnswerRef = useRef(onAnswer);

  useEffect(() => { onAnswerRef.current = onAnswer; }, [onAnswer]);

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

  const handleAnswer = (index: number) => commitAnswer(index, 1500);

  const progressPercent = (timeLeft / timeLimitMs) * 100;
  const isLow = progressPercent < 30;

  return (
    <div className="w-full max-w-md flex flex-col gap-4 animate-in fade-in duration-500">

      {/* Score strip */}
      <div className="flex items-center justify-between text-xs font-bold text-white/50 px-1">
        <span>شما: <span className="text-white font-black">{myScore}</span></span>
        <span className="text-white/20">—</span>
        <span>حریف: <span className="text-white font-black">{opponentScore}</span></span>
      </div>

      {/* Question card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative backdrop-blur-sm shadow-xl">
        {/* Category badge */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-5 py-1 rounded-full text-xs font-black shadow-lg shadow-violet-500/30 border border-violet-400/30 whitespace-nowrap">
          {CATEGORIES[category].icon} {CATEGORIES[category].label}
        </div>

        <h3 className="text-lg font-black text-center text-white leading-relaxed mt-2">
          {question.text}
        </h3>

        <div className="mt-4 text-center text-white/20 text-[10px] font-bold">
          طراح: <span className="text-white/30">{question.authorName || 'ویستا'}</span>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3">
        <button
          disabled
          title="به زودی"
          className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl w-12 h-12 flex flex-col items-center justify-center gap-0.5 cursor-not-allowed opacity-50"
        >
          <Pause size={16} className="text-amber-300" />
          <div className="flex items-center gap-0.5 text-white/50 text-[9px] font-bold">
            ۳۰<div className="relative w-2.5 h-2.5"><Image src="/images/coin.png" alt="" fill /></div>
          </div>
        </button>

        <div className="flex-1 bg-white/8 h-3 rounded-full overflow-hidden border border-white/10">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-75 ease-linear',
              isLow
                ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                : 'bg-gradient-to-r from-violet-500 to-cyan-400'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className={cn('text-xs font-black w-8 text-right', isLow ? 'text-rose-400' : 'text-white/50')}>
          {Math.ceil(timeLeft / 1000)}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2.5">
        {question.options.map((option, index) => {
          const colors = OPTION_COLORS[index % OPTION_COLORS.length];
          const isSelected = selectedAnswer === index;
          const isCorrect = index === question.correctOptionIndex;
          const showCorrect = selectedAnswer !== null && isCorrect;
          const isWrong = isSelected && !isCorrect;
          const isDimmed = selectedAnswer !== null && !isSelected && !isCorrect;

          let cls: string;
          if (showCorrect) cls = colors.correct;
          else if (isWrong) cls = colors.wrong;
          else if (isDimmed) cls = colors.dim;
          else cls = colors.base;

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
              className={cn(
                'p-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center min-h-[72px] border active:scale-95',
                cls,
                selectedAnswer === null && 'hover:brightness-125 active:translate-y-0.5',
                (showCorrect || isWrong) && 'shadow-lg'
              )}
            >
              <span className="text-center leading-tight">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Lifelines */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Percent size={20} className="text-violet-400" />, label: 'جواب مردم', cost: '۶۰' },
          { icon: <Bomb size={20} className="text-rose-400" />, label: 'حذف دو گزینه', cost: '۴۰' },
          { icon: <span className="font-black text-amber-400 text-lg">۲x</span>, label: 'شانس مجدد', cost: '۴۰' },
        ].map((item, i) => (
          <button
            key={i}
            disabled
            title="به زودی"
            className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center gap-1 cursor-not-allowed opacity-40"
          >
            {item.icon}
            <span className="text-[9px] font-bold text-white/60 text-center leading-tight">{item.label}</span>
            <div className="flex items-center gap-0.5 text-white/40 text-[9px] font-bold">
              {item.cost}<div className="relative w-2.5 h-2.5"><Image src="/images/coin.png" alt="" fill /></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
