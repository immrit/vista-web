'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
                    // Variants
                    variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500/20 shadow-sm',
                    variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500/20',
                    variant === 'ghost' && 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500/20',
                    variant === 'outline' && 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500/20',
                    // Sizes
                    size === 'sm' && 'h-9 px-3 text-sm',
                    size === 'md' && 'h-12 px-6 text-sm',
                    size === 'lg' && 'h-14 px-8 text-base',
                    className
                )}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent ml-2" />
                )}
                {children}
            </button>
        )
    }
)

Button.displayName = "Button"

export { Button }
