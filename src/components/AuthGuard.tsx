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
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isRedirecting, setIsRedirecting] = useState(false)

    useEffect(() => {
        if (!loading && !isRedirecting) {
            if (requireAuth && !user) {
                setIsRedirecting(true)
                router.replace(redirectTo)
            } else if (!requireAuth && user) {
                setIsRedirecting(true)
                router.replace('/feed')
            }
        }
    }, [user, loading, router, requireAuth, redirectTo, isRedirecting])

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