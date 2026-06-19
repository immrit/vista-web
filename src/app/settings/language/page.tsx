'use client';

import { useRouter } from 'next/navigation';
import { MobileTopBar } from '@/components/layout/MobileTopBar';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import i18n from '@/lib/i18n';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('vista-lang', lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <>
      <MobileTopBar title={t('settings.language')} onBack={() => router.back()} />
      <div className="feed-container px-4 py-6 max-w-2xl mx-auto">
        <h1 className="hidden lg:block text-2xl font-bold mb-6">{t('settings.language')}</h1>

        <div className="bg-vista-surface dark:bg-vista-surface-dark rounded-2xl border border-vista-border dark:border-vista-border-dark overflow-hidden">
          <button
            onClick={() => handleLanguageChange('fa')}
            className="w-full flex items-center justify-between p-4 hover:bg-vista-surface-variant transition-colors border-b border-vista-border dark:border-vista-border-dark"
          >
            <span className="font-medium text-lg text-right">فارسی</span>
            {i18n.language === 'fa' && <Check className="w-5 h-5 text-vista-primary" />}
          </button>
          
          <button
            onClick={() => handleLanguageChange('en')}
            className="w-full flex items-center justify-between p-4 hover:bg-vista-surface-variant transition-colors"
          >
            <span className="font-medium text-lg text-left" dir="ltr">English</span>
            {i18n.language === 'en' && <Check className="w-5 h-5 text-vista-primary" />}
          </button>
        </div>
      </div>
    </>
  );
}
