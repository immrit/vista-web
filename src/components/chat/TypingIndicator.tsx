'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
    isTyping?: boolean;
    className?: string;
}

export function TypingIndicator({ isTyping = false, className }: TypingIndicatorProps) {
    if (!isTyping) return null;

    return (
        <div className={cn('flex items-center gap-1 p-3', className)}>
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );
}


