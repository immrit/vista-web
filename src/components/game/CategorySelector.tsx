import React, { useState } from 'react';
import { CATEGORIES, Category } from '@/lib/game/questions';
import Image from 'next/image';

interface CategorySelectorProps {
  categories: Category[];
  onSelect: (categoryId: Category) => void;
  disabled?: boolean;
  opponentName: string;
}

const SLOT_STYLES: Array<{ border: string; bg: string; glow: string }> = [
  { border: 'border-violet-500/50', bg: 'bg-violet-500/10', glow: 'shadow-violet-500/20' },
  { border: 'border-cyan-500/50',   bg: 'bg-cyan-500/10',   glow: 'shadow-cyan-500/20'   },
  { border: 'border-rose-500/50',   bg: 'bg-rose-500/10',   glow: 'shadow-rose-500/20'   },
  { border: 'border-amber-500/50',  bg: 'bg-amber-500/10',  glow: 'shadow-amber-500/20'  },
];

export function CategorySelector({ categories, onSelect, disabled, opponentName }: CategorySelectorProps) {
  const [selected, setSelected] = useState<Category | null>(null);

  const handleSelect = (cat: Category) => {
    if (disabled || selected) return;
    setSelected(cat);
    setTimeout(() => onSelect(cat), 300);
  };

  const displayCats = categories.slice(0, Math.min(4, categories.length));
  const gridCols = displayCats.length <= 2 ? 'grid-cols-2' : displayCats.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto gap-6 animate-in fade-in duration-500">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white leading-tight">انتخاب موضوع</h2>
        <p className="text-white/40 text-sm">
          در مقابل <span className="text-cyan-400 font-bold">{opponentName}</span>
        </p>
      </div>

      <div className={`grid gap-3 w-full px-2 ${gridCols}`}>
        {displayCats.map((catId, idx) => {
          const cat = CATEGORIES[catId];
          const style = SLOT_STYLES[idx % SLOT_STYLES.length];
          const isSelected = selected === catId;
          const isDisabled = disabled || (!!selected && selected !== catId);

          return (
            <button
              key={catId}
              onClick={() => handleSelect(catId)}
              disabled={disabled || !!selected}
              className={[
                'relative rounded-2xl p-5 flex flex-col items-center justify-center gap-3 min-h-[120px]',
                'transition-all duration-300 border bg-white/5 backdrop-blur-sm',
                isSelected
                  ? `${style.border} ${style.bg} scale-95 shadow-lg ${style.glow}`
                  : isDisabled
                    ? 'border-white/5 opacity-40 cursor-not-allowed'
                    : `border-white/10 hover:${style.border} hover:${style.bg} cursor-pointer active:scale-95`,
              ].join(' ')}
            >
              <span className="text-4xl drop-shadow-lg select-none">{cat.icon}</span>
              <span className="text-white font-black text-sm text-center leading-tight">{cat.label}</span>
              {isSelected && (
                <div className="absolute inset-0 rounded-2xl bg-black/20 flex items-center justify-center">
                  <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-white/25 text-xs">تغییر موضوعات پیشنهادی</p>
        <button
          disabled
          title="به زودی"
          className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/25 px-5 py-2 rounded-xl cursor-not-allowed text-sm font-bold"
        >
          <div className="relative w-4 h-4"><Image src="/images/coin.png" alt="coin" fill /></div>
          <span>۸۰ سکه</span>
        </button>
      </div>
    </div>
  );
}
