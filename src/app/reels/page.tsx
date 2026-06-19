'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { postApi } from '@/lib/backendApi'
import { useAuth } from '@/hooks/useAuth'
import { Heart, MessageSquare, Share2, Volume2, VolumeX, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'
import type { PostWithProfile } from '@/lib/types'

export default function ReelsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [reels, setReels] = useState<PostWithProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [offset, setOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const touchStartY = useRef(0)

  const loadMore = useCallback(async () => {
    try {
      const data = await postApi.explore(10, undefined)
      const videos = data.posts.filter(p => p.video_url)
      setReels(prev => [...prev, ...videos])
      setOffset(o => o + data.posts.length)
    } catch { /* silent */ }
  }, [offset])

  useEffect(() => {
    setIsLoading(true)
    postApi.explore(20).then(data => {
      setReels(data.posts.filter(p => p.video_url))
      setOffset(data.posts.length)
    }).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === currentIndex) {
        v.muted = isMuted
        void v.play().catch(() => { v.muted = true; void v.play() })
      } else {
        v.pause()
        v.currentTime = 0
      }
    })
  }, [currentIndex, isMuted])

  useEffect(() => {
    if (reels.length > 0 && currentIndex >= reels.length - 3) void loadMore()
  }, [currentIndex, reels.length])

  const goTo = (i: number) => {
    if (i < 0 || i >= reels.length) return
    setCurrentIndex(i)
    containerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 60) goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1)
  }

  const handleLike = async (post: PostWithProfile) => {
    if (!user) { router.push('/auth'); return }
    try {
      if (post.is_liked) {
        await apiClient.delete(`/v1/posts/${post.id}/like`)
      } else {
        await apiClient.post(`/v1/posts/${post.id}/like`)
      }
      setReels(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: !p.is_liked, likes_count: p.likes_count + (p.is_liked ? -1 : 1) } : p))
    } catch { toast.error('خطا') }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white text-center">
        <div>
          <p className="text-lg font-semibold mb-2">ریلی یافت نشد</p>
          <button onClick={() => router.back()} className="text-sm text-zinc-400">بازگشت</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        aria-label="بازگشت"
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white"
      >
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Mute */}
      <button
        onClick={() => setIsMuted(m => !m)}
        aria-label={isMuted ? 'فعال کردن صدا' : 'خاموش کردن صدا'}
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/40 text-white"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Navigation arrows (desktop) */}
      <div className="hidden md:flex absolute left-4 inset-y-0 items-center z-20 flex-col justify-center gap-2">
        <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} aria-label="ریل قبلی"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition">
          <ChevronUp className="w-6 h-6" />
        </button>
        <button onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === reels.length - 1} aria-label="ریل بعدی"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Reels */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-full overflow-hidden"
      >
        {reels.map((reel, i) => (
          <div
            key={reel.id}
            className={cn('relative h-full w-full flex items-center justify-center transition-transform duration-300')}
            style={{ transform: `translateY(${(i - currentIndex) * 100}%)`, position: 'absolute', inset: 0 }}
          >
            <video
              ref={el => { videoRefs.current[i] = el }}
              src={reel.video_url!}
              className="h-full w-full object-contain"
              loop
              playsInline
              preload={Math.abs(i - currentIndex) <= 1 ? 'auto' : 'none'}
              onClick={() => { const v = videoRefs.current[i]; if (v) v.paused ? void v.play() : v.pause() }}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Right sidebar actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
              <button onClick={() => handleLike(reel)} aria-label="لایک" className="flex flex-col items-center gap-1">
                <div className={cn('w-12 h-12 rounded-full bg-black/40 flex items-center justify-center', reel.is_liked && 'text-red-500')}>
                  <Heart className={cn('w-6 h-6 text-white', reel.is_liked && 'fill-red-500 text-red-500')} />
                </div>
                <span className="text-white text-xs font-semibold">{reel.likes_count || 0}</span>
              </button>

              <Link href={`/post/${reel.id}`} aria-label="کامنت" className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">{reel.comments_count || 0}</span>
              </Link>

              <button
                onClick={async () => {
                  const url = `${window.location.origin}/post/${reel.id}`
                  if (navigator.share) {
                    await navigator.share({ url }).catch(() => {})
                  } else {
                    await navigator.clipboard.writeText(url)
                    toast.success('لینک کپی شد')
                  }
                }}
                aria-label="اشتراک‌گذاری"
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-6 left-4 right-16 text-white">
              <Link href={`/profile/${reel.profiles?.username}`} className="flex items-center gap-2 mb-2">
                {reel.profiles?.avatar_url ? (
                  <img src={reel.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/60" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-vista-gradient flex items-center justify-center text-sm font-bold">
                    {(reel.profiles?.full_name || reel.profiles?.username || 'و').charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-sm">@{reel.profiles?.username}</span>
              </Link>
              {reel.content && (
                <p className="text-sm leading-relaxed line-clamp-2 opacity-90">{reel.content}</p>
              )}
            </div>

            {/* Progress dots */}
            <div className="absolute top-1/2 -translate-y-1/2 left-2 flex flex-col gap-1">
              {reels.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((_, j) => {
                const absIdx = Math.max(0, currentIndex - 3) + j
                return (
                  <div key={absIdx} className={cn('w-1 rounded-full transition-all', absIdx === currentIndex ? 'h-6 bg-white' : 'h-2 bg-white/40')} />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
