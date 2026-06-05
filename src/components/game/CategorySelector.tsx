import React from 'react';
import { CATEGORIES, Category } from '@/lib/game/questions';
import { cn } from '@/lib/utils'; // Assuming standard tailwind-merge util

interface CategorySelectorProps {
  categories: Category[];
  onSelect: (categoryId: Category) => void;
  disabled?: boolean;
}

export function CategorySelector({ categories, onSelect, disabled }: CategorySelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500 w-full">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 py-4 rounded-full border-b-4 border-indigo-200 dark:border-indigo-900 shadow-md animate-wobble">
        <h2 className="text-3xl md:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500 drop-shadow-sm">
          نوبت شماست! یک دسته‌بندی انتخاب کنید
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {categories.map((catId, idx) => {
          const cat = CATEGORIES[catId];
          const gradients = [
            "from-sky-400 to-indigo-500 border-indigo-700 shadow-[0_8px_0_0_#4338ca]",
            "from-pink-400 to-rose-500 border-rose-700 shadow-[0_8px_0_0_#be123c]",
            "from-emerald-400 to-teal-500 border-teal-700 shadow-[0_8px_0_0_#0f766e]"
          ];
          const bgClass = gradients[idx % gradients.length];

          return (
            <button
              key={catId}
              onClick={() => onSelect(catId)}
              disabled={disabled}
              className={cn(
                "group relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-200",
                "bg-gradient-to-b border-b-[6px]",
                bgClass,
                "hover:-translate-y-2 active:translate-y-[6px] active:border-b-0 active:shadow-none",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:border-b-0"
              )}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col items-center space-y-4 relative z-10 animate-bounce-short">
                <span className="text-7xl filter drop-shadow-md group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-2xl font-black text-white drop-shadow-md bg-black/20 px-4 py-1 rounded-full">{cat.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
