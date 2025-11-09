'use client'

import { useEffect, useState } from 'react'

interface HydrationProviderProps {
    children: React.ReactNode
}

export default function HydrationProvider({ children }: HydrationProviderProps) {
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
} 