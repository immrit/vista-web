'use client';
import React from 'react';

import { cn } from '@/lib/utils';

interface AvatarProps {
    src?: string | null;
    alt?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
    const [imgError, setImgError] = React.useState(false);
    const safeAlt = alt?.trim() ?? '';
    const initials = safeAlt
        ? safeAlt
              .split(' ')
              .filter(Boolean)
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '؟';

    const imageSrc = (!imgError && src) ? src : undefined;
    const imageAlt = safeAlt || 'کاربر';

    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold overflow-hidden flex-shrink-0',
                sizeClasses[size],
                className
            )}
        >
            {imageSrc ? (
                <img 
                    src={imageSrc} 
                    alt={imageAlt} 
                    className="w-full h-full object-cover" 
                    onError={() => setImgError(true)}
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}






