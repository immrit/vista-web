export type Category = 'general' | 'cinema' | 'sports' | 'technology' | 'history' | 'science' | 'music' | 'literature';

export interface Question {
  id: string;
  categoryId: Category;
  text: string;
  options: string[];
  correctOptionIndex: number;
  authorName?: string;
}

export const CATEGORIES: Record<Category, { id: Category; label: string; icon: string }> = {
  general:    { id: 'general',    label: 'اطلاعات عمومی', icon: '🌍' },
  cinema:     { id: 'cinema',     label: 'سینما',         icon: '🎬' },
  sports:     { id: 'sports',     label: 'ورزش',          icon: '⚽' },
  technology: { id: 'technology', label: 'تکنولوژی',      icon: '💻' },
  history:    { id: 'history',    label: 'تاریخ',         icon: '🏛️' },
  science:    { id: 'science',    label: 'علوم',          icon: '🔬' },
  music:      { id: 'music',      label: 'موسیقی',        icon: '🎵' },
  literature: { id: 'literature', label: 'ادبیات',        icon: '📚' },
};

export function getRandomCategories(count: number = 3): Category[] {
  const cats = Object.keys(CATEGORIES) as Category[];
  const shuffled = cats.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
