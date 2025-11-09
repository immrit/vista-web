'use client'

import { Crown } from 'lucide-react'

interface GoldenTickBadgeProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export default function GoldenTickBadge({ size = 'md', className = '' }: GoldenTickBadgeProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    }

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 16
    }

    return (
        <div
            className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg ${sizeClasses[size]} ${className}`}
            title="تیک طلایی ویستا"
        >
            <Crown
                className="text-white"
                size={iconSizes[size]}
                fill="currentColor"
            />
        </div>
    )
} 