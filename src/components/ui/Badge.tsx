'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
    count: number;
    max?: number;
    className?: string;
}

export function Badge({ count, max = 99, className }: BadgeProps) {
    if (count === 0) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
        <span
            className={cn(
                'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold',
                className
            )}
        >
            {displayCount}
        </span>
    );
}


