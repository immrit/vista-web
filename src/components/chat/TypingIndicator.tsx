'use client';

import { cn } from '@/lib/utils';
import type { TypingUser } from '@/lib/types';

interface TypingIndicatorProps {
    isTyping?: boolean;
    users?: TypingUser[];
    className?: string;
}

export function TypingIndicator({ isTyping = false, users = [], className }: TypingIndicatorProps) {
    // Support both old API (isTyping) and new API (users array)
    const shouldShow = isTyping || (users && users.length > 0);
    
    if (!shouldShow) return null;

    // Get names for display
    const names = users.length > 0 
        ? users.map(u => u.name).join(', ')
        : '';

    return (
        <div className={cn('flex items-center gap-1 p-3', className)}>
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2">
                {names && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {names} {users.length === 1 ? 'در حال تایپ...' : 'در حال تایپ هستند...'}
                    </span>
                )}
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}


