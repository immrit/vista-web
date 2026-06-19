'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { profileApi } from '@/lib/backendApi'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { PostCard } from '@/components/ui/PostCard'
import { ArrowRight, Hash, Loader2 } from 'lucide-react'
import type { PostWithProfile } from '@/lib/types'

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>()
  const router = useRouter()
  const decodedTag = decodeURIComponent(tag)
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const loaderRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    try {
      const result = await profileApi.getHashtagPosts(decodedTag, 20, currentOffset)
      setPosts(prev => reset ? result.posts : [...prev, ...result.posts])
      setHasMore(result.has_more)
      setOffset(currentOffset + result.posts.length)
    } catch {
      // silent fail — empty state shown
    } finally {
      setIsLoading(false)
    }
  }, [decodedTag, offset])

  useEffect(() => { void load(true) }, [decodedTag])

  useEffect(() => {
    if (!loaderRef.current || !hasMore) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void load() }, { rootMargin: '200px' })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, load])

  return (
    <div className="min-h-screen bg-vista-bg dark:bg-vista-bg-dark">
      <MobileTopBar title={`#${decodedTag}`} showLogo={false} showNotifications={false}
        rightAction={
          <button onClick={() => router.back()} aria-label="بازگشت" className="p-2 rounded-full hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark">
            <ArrowRight className="w-5 h-5" />
          </button>
        }
      />

      <div className="feed-container py-4">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-vista-gradient flex items-center justify-center">
            <Hash className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">#{decodedTag}</h1>
            {posts.length > 0 && <p className="text-sm text-vista-text-secondary">{posts.length}+ پست</p>}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-vista-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Hash className="w-12 h-12 mx-auto mb-4 text-vista-text-secondary" />
            <p className="font-semibold text-lg">هنوز پستی با #{decodedTag} نیست</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
            <div ref={loaderRef} className="h-4" />
            {hasMore && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-vista-primary" /></div>}
          </div>
        )}
      </div>
    </div>
  )
}
