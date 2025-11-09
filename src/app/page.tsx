'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, profile, loading, error: authError } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('=== HOME PAGE DEBUG ===')
    console.log('Loading:', loading)
    console.log('User:', user)
    console.log('Profile:', profile)
    console.log('IsRedirecting:', isRedirecting)
    console.log('Error:', error)
    console.log('AuthError:', authError)
    console.log('=== END DEBUG ===')

    // فقط وقتی loading تمام شد و redirect نکرده باشیم
    if (!loading && !isRedirecting) {
      console.log('Starting redirect process...')
      setIsRedirecting(true)

      try {
        // همیشه به /feed هدایت کن، بگذار feed خودش authentication را handle کند
        console.log('Redirecting to /feed')
        router.replace('/feed')
      } catch (err) {
        console.error('Error during redirect:', err)
        setError('خطا در هدایت')
        setIsRedirecting(false)
      }
    }

    // اگر بیش از 1.5 ثانیه loading بود، به /feed redirect کن
    const redirectTimeout = setTimeout(() => {
      if (loading && !isRedirecting) {
        console.log('Loading timeout, redirecting to /feed anyway')
        setIsRedirecting(true)
        router.replace('/feed')
      }
    }, 1500) // 1.5 seconds instead of 3

    return () => clearTimeout(redirectTimeout)
  }, [user, profile, loading, router, isRedirecting, error, authError])

  // اگر خطا داریم
  if (error || authError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error || authError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              تلاش مجدد
            </button>
            <button
              onClick={() => router.push('/feed')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              مشاهده فید
            </button>
          </div>
        </div>
      </main>
    )
  }

  // اگر هنوز loading است یا redirect می‌کنیم، loading screen نشان بده
  if (loading || isRedirecting) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {loading ? 'در حال بررسی احراز هویت...' : 'در حال هدایت...'}
          </p>
          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              لطفاً صبر کنید...
            </p>
          )}
        </div>
      </main>
    )
  }

  // این نباید نمایش داده شود، اما برای safety
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">در حال هدایت...</p>
        <button
          onClick={() => router.push('/feed')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          مشاهده فید
        </button>
      </div>
    </main>
  )
}
