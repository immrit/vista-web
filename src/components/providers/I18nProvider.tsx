'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useEffect } from 'react';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Optionally read from localStorage here or let i18n handle it if using detector
    const savedLang = localStorage.getItem('vista-lang') || 'fa';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
    document.documentElement.dir = savedLang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
