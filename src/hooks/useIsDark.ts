'use client';

import { useEffect, useState } from 'react';

function readIsDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(readIsDark);

  useEffect(() => {
    const update = () => setIsDark(readIsDark());
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', update);
    };
  }, []);

  return isDark;
}
