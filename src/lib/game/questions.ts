export type Category = 'general' | 'cinema' | 'sports' | 'technology';

export interface Question {
  id: string;
  categoryId: Category;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export const CATEGORIES: Record<Category, { id: Category; label: string; icon: string }> = {
  general: { id: 'general', label: 'اطلاعات عمومی', icon: '🌍' },
  cinema: { id: 'cinema', label: 'سینما', icon: '🎬' },
  sports: { id: 'sports', label: 'ورزش', icon: '⚽' },
  technology: { id: 'technology', label: 'تکنولوژی', icon: '💻' },
};

export const QUESTIONS: Question[] = [
  // General
  {
    id: 'q_gen_1',
    categoryId: 'general',
    text: 'پایتخت استرالیا کدام شهر است؟',
    options: ['سیدنی', 'ملبورن', 'کانبرا', 'پرت'],
    correctOptionIndex: 2,
  },
  {
    id: 'q_gen_2',
    categoryId: 'general',
    text: 'عمیق‌ترین اقیانوس جهان کدام است؟',
    options: ['اقیانوس آرام', 'اقیانوس هند', 'اقیانوس اطلس', 'منجمد شمالی'],
    correctOptionIndex: 0,
  },
  {
    id: 'q_gen_3',
    categoryId: 'general',
    text: 'طولانی‌ترین رود جهان چه نام دارد؟',
    options: ['رود آمازون', 'رود نیل', 'میسیسیپی', 'یانگ‌تسه'],
    correctOptionIndex: 1,
  },
  
  // Cinema
  {
    id: 'q_cin_1',
    categoryId: 'cinema',
    text: 'کدام کارگردان فیلم «پدرخوانده» را ساخته است؟',
    options: ['استیون اسپیلبرگ', 'مارتین اسکورسیزی', 'فرانسیس فورد کاپولا', 'کوئنتین تارانتینو'],
    correctOptionIndex: 2,
  },
  {
    id: 'q_cin_2',
    categoryId: 'cinema',
    text: 'کدام بازیگر نقش «مرد آهنی» (Iron Man) را بازی کرده است؟',
    options: ['کریس ایوانز', 'تام هالند', 'رابرت داونی جونیور', 'کریس همسورث'],
    correctOptionIndex: 2,
  },
  {
    id: 'q_cin_3',
    categoryId: 'cinema',
    text: 'اولین فیلم رنگی تاریخ سینما در چه دهه‌ای ساخته شد؟',
    options: ['دهه 1900', 'دهه 1920', 'دهه 1940', 'دهه 1950'],
    correctOptionIndex: 1, // Technicolor early days, approx.
  },

  // Sports
  {
    id: 'q_spo_1',
    categoryId: 'sports',
    text: 'کدام کشور بیشترین قهرمانی را در جام جهانی فوتبال دارد؟',
    options: ['آلمان', 'ایتالیا', 'برزیل', 'آرژانتین'],
    correctOptionIndex: 2,
  },
  {
    id: 'q_spo_2',
    categoryId: 'sports',
    text: 'یک تیم والیبال چند بازیکن در زمین دارد؟',
    options: ['۵ بازیکن', '۶ بازیکن', '۷ بازیکن', '۱۱ بازیکن'],
    correctOptionIndex: 1,
  },
  {
    id: 'q_spo_3',
    categoryId: 'sports',
    text: 'تایگر وودز در کدام رشته ورزشی مشهور است؟',
    options: ['تنیس', 'بسکتبال', 'گلف', 'بیسبال'],
    correctOptionIndex: 2,
  },

  // Technology
  {
    id: 'q_tech_1',
    categoryId: 'technology',
    text: 'بنیان‌گذار شرکت مایکروسافت کیست؟',
    options: ['استیو جابز', 'بیل گیتس', 'ایلان ماسک', 'مارک زاکربرگ'],
    correctOptionIndex: 1,
  },
  {
    id: 'q_tech_2',
    categoryId: 'technology',
    text: 'کدام زبان برنامه‌نویسی برای طراحی ظاهر صفحات وب استفاده می‌شود؟',
    options: ['Python', 'Java', 'CSS', 'C++'],
    correctOptionIndex: 2,
  },
  {
    id: 'q_tech_3',
    categoryId: 'technology',
    text: 'اولین نسخه سیستم عامل اندروید در چه سالی منتشر شد؟',
    options: ['۲۰۰۵', '۲۰۰۸', '۲۰۱۰', '۲۰۱۲'],
    correctOptionIndex: 1,
  }
];

export function getRandomCategories(count: number = 3): Category[] {
  const cats = Object.keys(CATEGORIES) as Category[];
  const shuffled = cats.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getQuestionsForCategory(categoryId: Category, count: number = 3): Question[] {
  const filtered = QUESTIONS.filter(q => q.categoryId === categoryId);
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
