'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Suspense } from 'react'

function ShareTargetInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [handled, setHandled] = useState(false)

  useEffect(() => {
    if (handled) return
    setHandled(true)

    const title = params.get('title') || ''
    const text = params.get('text') || ''
    const url = params.get('url') || ''

    // Build a combined share text
    const parts = [title, text, url].filter(Boolean)
    const shareContent = parts.join('\n')

    if (shareContent) {
      // Redirect to create post with pre-filled content
      router.replace(`/post?content=${encodeURIComponent(shareContent)}`)
    } else {
      toast('محتوایی برای اشتراک‌گذاری یافت نشد')
      router.replace('/feed')
    }
  }, [params, router, handled])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-vista-bg dark:bg-vista-bg-dark">
      <Loader2 className="w-10 h-10 animate-spin text-vista-primary" />
      <p className="text-sm text-vista-text-secondary">در حال پردازش محتوا...</p>
    </div>
  )
}

export default function ShareTargetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-vista-primary" />
      </div>
    }>
      <ShareTargetInner />
    </Suspense>
  )
}
