'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
    children: React.ReactNode
    requireAuth?: boolean
    redirectTo?: string
}

export default function AuthGuard({
    children,
    requireAuth = true,
    redirectTo = '/auth'
}: AuthGuardProps) {
    const { user, loading, error } = useAuth()
    const router = useRouter()
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    // Hydration safety
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return

        // Only redirect if not loading and not already redirecting
        if (!loading && !isRedirecting) {
            if (requireAuth && !user) {
                console.log('AuthGuard: User not authenticated, redirecting to', redirectTo)
                setIsRedirecting(true)
                router.replace(redirectTo)
            } else if (!requireAuth && user) {
                console.log('AuthGuard: User already authenticated, redirecting to /feed')
                setIsRedirecting(true)
                router.replace('/feed')
            }
        }
    }, [user, loading, router, requireAuth, redirectTo, isRedirecting, isHydrated])

    // Show loading during hydration
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

    // Show error if there's an authentication error
    if (error && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-zinc-900 dark:to-zinc-800">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        خطا در احراز هویت
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        تلاش مجدد
                    </button>
                </div>
            </div>
        )
    }

    // اگر هنوز loading است یا redirect می‌کنیم، loading screen نشان بده
    if (loading || isRedirecting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
                </div>
            </div>
        )
    }

    // اگر requireAuth است و کاربر لاگین نکرده، چیزی نشان نده
    if (requireAuth && !user) {
        return null
    }

    // اگر requireAuth نیست و کاربر لاگین کرده، چیزی نشان نده
    if (!requireAuth && user) {
        return null
    }

    // در غیر این صورت، children را نشان بده
    return <>{children}</>
} 