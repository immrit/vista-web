import React, { useEffect, useState } from 'react';
import { Question } from '@/lib/game/questions';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answerIndex: number, timeTakenMs: number) => void;
  timeLimitMs?: number;
}

export function QuestionCard({ question, onAnswer, timeLimitMs = 10000 }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimitMs);
  const startTime = React.useRef(Date.now());

  useEffect(() => {
    // Reset state when question changes
    setSelectedAnswer(null);
    setTimeLeft(timeLimitMs);
    startTime.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleAnswer(-1); // Timeout
      }
    }, 50); // High frequency for smooth progress bar

    return () => clearInterval(interval);
  }, [question, timeLimitMs]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const timeTaken = Date.now() - startTime.current;
    
    // Slight delay so the user can see the correct answer highlight
    setTimeout(() => {
      onAnswer(index, timeTaken);
    }, 1500);
  };

  const progressPercent = (timeLeft / timeLimitMs) * 100;

  return (
    <div className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_10px_30px_rgba(99,102,241,0.2)] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border-4 border-white/50 dark:border-slate-800/50 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 dark:from-indigo-900/10 dark:to-purple-900/10 pointer-events-none"></div>
      
      {/* Timer Bar */}
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-t-[2.5rem]">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-75 ease-linear shadow-inner",
            progressPercent > 50 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : progressPercent > 20 ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-rose-400 to-rose-500"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-8 relative z-10">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-800/50 mb-8 shadow-sm">
          <h3 className="text-2xl md:text-3xl font-black text-center text-indigo-900 dark:text-indigo-100 leading-tight drop-shadow-sm">
            {question.text}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctOptionIndex;
            const isWrongSelected = isSelected && !isCorrect;
            const showCorrect = selectedAnswer !== null && isCorrect;

            let btnClass = "bg-gradient-to-b from-sky-400 to-indigo-500 text-white border-b-[6px] border-indigo-700 hover:from-sky-300 hover:to-indigo-400 active:border-b-0 active:translate-y-[6px] shadow-md";
            
            if (showCorrect) {
              btnClass = "bg-gradient-to-b from-emerald-400 to-emerald-500 text-white border-b-[6px] border-emerald-700 scale-[1.02] shadow-[0_0_20px_rgba(52,211,153,0.5)] z-10 animate-pop border-b-0 translate-y-[6px]";
            } else if (isWrongSelected) {
              btnClass = "bg-gradient-to-b from-rose-400 to-rose-500 text-white border-b-0 translate-y-[6px] shadow-none animate-shake";
            } else if (selectedAnswer !== null) {
              btnClass = "opacity-40 grayscale border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 text-slate-500 border-b-0 translate-y-[6px] shadow-none";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={cn(
                  "relative p-5 rounded-[2rem] font-black text-xl transition-all duration-200",
                  btnClass
                )}
              >
                <span className="drop-shadow-md">{option}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
