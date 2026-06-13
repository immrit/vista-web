'use client';

import { useIsDark } from '@/hooks/useIsDark';
import { cn } from '@/lib/utils';

interface ChatBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatBackground({ children, className }: ChatBackgroundProps) {
  const isDark = useIsDark();

  return (
    <div className={cn('relative flex flex-col h-full min-h-0 overflow-hidden', className)}>
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: isDark ? '#0F0F0F' : '#DFE5E9' }}
      />
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-90"
        style={{
          backgroundImage: `url(${isDark ? '/assets/images/vista_custom_bg_dark.png' : '/assets/images/vista_custom_bg.png'})`,
        }}
      />
      <div
        className={cn(
          'absolute inset-0 -z-10 backdrop-blur-[3px]',
          isDark ? 'bg-black/20' : 'bg-white/20',
        )}
      />
      {children}
    </div>
  );
}
