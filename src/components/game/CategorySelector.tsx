import React, { useState } from 'react';
import { CATEGORIES, Category } from '@/lib/game/questions';
import Image from 'next/image';

interface CategorySelectorProps {
  categories: Category[];
  onSelect: (categoryId: Category) => void;
  disabled?: boolean;
  opponentName: string;
  onReroll?: () => Promise<void>;
}

export function CategorySelector({ categories, onSelect, disabled, opponentName, onReroll }: CategorySelectorProps) {
  const [selected, setSelected] = useState<Category | null>(null);
  const [rerolling, setRerolling] = useState(false);

  const handleReroll = async () => {
    if (!onReroll || rerolling || disabled || selected) return;
    setRerolling(true);
    try {
      await onReroll();
    } finally {
      setRerolling(false);
    }
  };

  const handleSelect = (cat: Category) => {
    if (disabled || selected) return;
    setSelected(cat);
    setTimeout(() => onSelect(cat), 300);
  };

  const slotColors = [
    { bg: '#d2303c', shadow: '#9e1a26', text: 'text-white' },
    { bg: '#ec6237', shadow: '#b84520', text: 'text-white' },
    { bg: '#7c3aed', shadow: '#4c1d95', text: 'text-white' },
    { bg: '#0f766e', shadow: '#134e4a', text: 'text-white' },
  ];

  const displayCats = categories.slice(0, Math.min(4, categories.length));

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md px-4">
          موضوع خود را مقابل <span className="text-[#d8b4fe]">{opponentName}</span> مشخص کنید
        </h2>
        <p className="text-white/80 text-sm font-medium">یکی از موضوعات زیر را انتخاب کنید</p>
      </div>

      <div className={`grid gap-4 w-full px-4 ${displayCats.length <= 2 ? 'grid-cols-2' : displayCats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {displayCats.map((catId, idx) => {
          const cat = CATEGORIES[catId];
          const color = slotColors[idx % slotColors.length];
          const isSelected = selected === catId;

          return (
            <button
              key={catId}
              onClick={() => handleSelect(catId)}
              disabled={disabled || !!selected}
              className={`
                relative rounded-3xl p-5 flex flex-col items-center justify-center space-y-2
                transition-all duration-300 min-h-[120px]
                border-2 border-white/20
                ${isSelected ? 'scale-95 brightness-110 ring-4 ring-white/60' : 'active:scale-95'}
                ${disabled || (selected && selected !== catId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
              `}
              style={{
                background: `linear-gradient(to bottom, ${color.bg}, ${color.shadow})`,
                boxShadow: isSelected ? `0 0 0 4px white, 0 8px 0 ${color.shadow}` : `0 8px 0 ${color.shadow}`,
              }}
            >
              <span className="text-4xl drop-shadow-lg">{cat.icon}</span>
              <span className="text-white font-black text-base text-center leading-tight drop-shadow-md">
                {cat.label}
              </span>
              {isSelected && (
                <div className="absolute inset-0 rounded-3xl bg-white/20 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <p className="text-white/70 text-xs font-medium">می‌خوای موضوعات پیشنهادی رو تغییر بدی؟</p>
        <button
          onClick={handleReroll}
          disabled={!onReroll || rerolling || disabled || !!selected}
          className="bg-[#78c02c] hover:brightness-110 text-white px-8 py-2 rounded-2xl shadow-[0_4px_0_#5da01f] active:translate-y-1 active:shadow-none transition-all flex items-center space-x-2 space-x-reverse border border-[#a2e858] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="relative w-5 h-5"><Image src="/images/coin.png" alt="coin" fill /></div>
          <span className="font-bold text-lg drop-shadow-md">۸۰</span>
          <span className="text-sm">{rerolling ? 'در حال تغییر...' : 'تغییر موضوع'}</span>
        </button>
      </div>
    </div>
  );
}
