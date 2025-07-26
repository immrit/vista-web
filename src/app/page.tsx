'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // فقط وقتی loading تمام شد و redirect نکرده باشیم
    if (!loading && !isRedirecting) {
      setIsRedirecting(true)

      if (!user) {
        console.log('User not logged in, redirecting to /auth')
        router.replace('/auth')
      } else {
        console.log('User logged in, redirecting to /feed')
        router.replace('/feed')
      }
    }
  }, [user, loading, router, isRedirecting])

  // اگر هنوز loading است یا redirect می‌کنیم، loading screen نشان بده
  if (loading || isRedirecting) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
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
      </div>
    </main>
  )
}
