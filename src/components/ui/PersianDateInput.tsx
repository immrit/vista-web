'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface PersianDateInputProps {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    placeholder?: string
    className?: string
    required?: boolean
}

// Persian to Gregorian date converter
function persianToGregorian(persianDate: string): string {
    if (!persianDate) return ''

    // Simple conversion - in production you might want to use a proper library like moment-jalaali
    const [year, month, day] = persianDate.split('-').map(Number)
    if (!year || !month || !day) return ''

    // Approximate conversion (Persian year is ~621 years ahead of Gregorian)
    const gregorianYear = year - 621
    return `${gregorianYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

// Gregorian to Persian date converter
function gregorianToPersian(gregorianDate: string): string {
    if (!gregorianDate) return ''

    const [year, month, day] = gregorianDate.split('-').map(Number)
    if (!year || !month || !day) return ''

    // Approximate conversion (Persian year is ~621 years ahead of Gregorian)
    const persianYear = year + 621
    return `${persianYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

// Format Persian date for display
function formatPersianDate(date: string): string {
    if (!date) return ''

    const [year, month, day] = date.split('-')
    if (!year || !month || !day) return ''

    // Convert to Persian numbers for display
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    const persianYear = year.split('').map(d => persianNumbers[parseInt(d)]).join('')
    const persianMonth = month.split('').map(d => persianNumbers[parseInt(d)]).join('')
    const persianDay = day.split('').map(d => persianNumbers[parseInt(d)]).join('')

    return `${persianYear}/${persianMonth}/${persianDay}`
}

// Parse Persian date from input
function parsePersianDate(input: string): string {
    if (!input) return ''

    // Remove all non-digit characters and convert Persian numbers to English
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    let cleaned = input
    persianNumbers.forEach((num, index) => {
        cleaned = cleaned.replace(new RegExp(num, 'g'), index.toString())
    })

    // Extract numbers
    const numbers = cleaned.match(/\d+/g)
    if (!numbers || numbers.length < 3) return ''

    const year = numbers[0].padStart(4, '0')
    const month = numbers[1].padStart(2, '0')
    const day = numbers[2].padStart(2, '0')

    // Basic validation
    if (parseInt(year) < 1300 || parseInt(year) > 1500) return ''
    if (parseInt(month) < 1 || parseInt(month) > 12) return ''
    if (parseInt(day) < 1 || parseInt(day) > 31) return ''

    return `${year}-${month}-${day}`
}

export function PersianDateInput({
    label,
    value,
    onChange,
    error,
    placeholder = "تاریخ تولد (شمسی)",
    className = "",
    required = false
}: PersianDateInputProps) {
    const [displayValue, setDisplayValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Convert Gregorian to Persian for display
    useEffect(() => {
        if (value) {
            const persianDate = gregorianToPersian(value)
            setDisplayValue(formatPersianDate(persianDate))
        } else {
            setDisplayValue('')
        }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        setDisplayValue(inputValue)

        // Parse and convert Persian date
        const parsedDate = parsePersianDate(inputValue)
        if (parsedDate) {
            const gregorianDate = persianToGregorian(parsedDate)
            onChange(gregorianDate)
        } else {
            onChange('')
        }
    }

    const handleBlur = () => {
        setIsFocused(false)
        // Format the display value if it's valid
        if (displayValue) {
            const parsedDate = parsePersianDate(displayValue)
            if (parsedDate) {
                setDisplayValue(formatPersianDate(parsedDate))
            } else {
                setDisplayValue('')
                onChange('')
            }
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 text-right">
                {label}
                {required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={`w-full h-12 px-4 py-3 pr-10 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-right transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 ${error ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/10 dark:focus:ring-red-400/10' : ''} ${className}`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-zinc-400 dark:text-zinc-500" />
                </div>
            </div>
            {error && (
                <p className="text-red-500 text-sm text-right">{error}</p>
            )}
            {isFocused && (
                <p className="text-xs text-zinc-500 text-right">
                    فرمت: YYYY/MM/DD (مثال: ۱۳۸۰/۰۱/۱۵)
                </p>
            )}
        </div>
    )
} 