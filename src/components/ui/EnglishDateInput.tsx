'use client'

import { Calendar } from 'lucide-react'

interface EnglishDateInputProps {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    placeholder?: string
    className?: string
}

export function EnglishDateInput({
    label,
    value,
    onChange,
    error,
    placeholder = "Birth date (Gregorian)",
    className = ""
}: EnglishDateInputProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left">
                {label}
            </label>
            <div className="relative">
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full h-12 px-4 py-3 pl-10 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-left transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 ${error ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/10 dark:focus:ring-red-400/10' : ''} ${className}`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-zinc-400 dark:text-zinc-500" />
                </div>
            </div>
            {error && (
                <p className="text-red-500 text-sm text-left">{error}</p>
            )}
        </div>
    )
} 