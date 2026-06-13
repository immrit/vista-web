'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useCallback, useRef } from 'react'
import { PostWithProfile, Profile } from '@/lib/types'
import { profileApi, postApi } from '@/lib/backendApi'
import { PostCard } from '@/components/ui/PostCard'
import { useRouter } from 'next/navigation'
import { useInfinitePosts } from '@/hooks/useInfinitePosts'
import { useFollowingFeed } from '@/hooks/useStories'
import { useOptimisticPost } from '@/hooks/useOptimisticPost'
import { PostErrorBoundary } from '@/components/ErrorBoundary'
import { postPreloader } from '@/lib/preloader/PostPreloader'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { SuggestedUsersPanel } from '@/components/layout/SuggestedUsersPanel'
import { StoryBar } from '@/components/stories/StoryBar'
import { cn } from '@/lib/theme/cn'
import { followApi } from '@/lib/socialApi'
import { toast } from 'sonner'

type FeedTab = 'forYou' | 'following'

function PostVisibilityTracker({ post, children }: { post: PostWithProfile; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!timerRef.current) {
              timerRef.current = setTimeout(() => {
                postApi.feedEvent(post.id, 'view').catch(() => {})
              }, 2000)
            }
          } else if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
          }
        })
      },
      { threshold: 0.6 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      observer.disconnect()
    }
  }, [post.id])

  return <div ref={ref}>{children}</div>
}

function FeedList({
  tab,
  user,
}: {
  tab: FeedTab
  user: ReturnType<typeof useAuth>['user']
}) {
  const forYou = useInfinitePosts()
  const following = useFollowingFeed()
  const query = tab === 'forYou' ? forYou : following
  const { applyOptimisticUpdates } = useOptimisticPost()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = query

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allPosts = data?.pages.flatMap(page => page.posts) || []
  const displayPosts = applyOptimisticUpdates(allPosts)

  const handlePostHover = useCallback(
    (index: number) => {
      postPreloader.preloadNext(index, allPosts)
    },
    [allPosts]
  )

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 skeleton rounded" />
                <div className="h-2 w-16 skeleton rounded" />
              </div>
            </div>
            <div className="h-48 skeleton rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-vista-text-secondary dark:text-vista-text-secondary-dark mb-4">
          در بارگذاری پست‌ها خطایی رخ داد
        </p>
        <button onClick={() => refetch()} className="btn-vista px-8">
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (displayPosts.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-vista-surface-variant dark:bg-vista-surface-variant-dark flex items-center justify-center text-2xl">
          📭
        </div>
        <p className="font-semibold mb-1">
          {tab === 'following' ? 'پستی از دنبال‌شوندگان نیست' : 'فید خالی است'}
        </p>
        <p className="text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark">
          {tab === 'following'
            ? 'کاربران بیشتری را دنبال کنید'
            : 'اولین پست را منتشر کنید!'}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-vista-border dark:divide-vista-border-dark">
      {displayPosts.map((post, index) => (
        <PostErrorBoundary key={post.id}>
          <PostVisibilityTracker post={post}>
            <div
              className="px-4 py-3 hover:bg-vista-surface-variant/30 dark:hover:bg-vista-surface-variant-dark/30 transition-colors"
              onMouseEnter={() => handlePostHover(index)}
            >
              <PostCard
                post={post}
                onUpdate={() => refetch()}
                onPostDeleted={() => refetch()}
                showComments={Boolean(user)}
              />
            </div>
          </PostVisibilityTracker>
        </PostErrorBoundary>
      ))}

      <div ref={loadMoreRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasNextPage && displayPosts.length > 0 && (
        <p className="text-center py-8 text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark">
          به انتهای فید رسیدید ✓
        </p>
      )}
    </div>
  )
}

export default function FeedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<FeedTab>('forYou')
  const [suggested, setSuggested] = useState<Profile[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      profileApi.search('', 8).then(results => {
        setSuggested(results.filter(item => item.id !== user.id))
      }).catch(() => setSuggested([]))
    }
  }, [user])

  const handleFollow = async (userId: string) => {
    try {
      await followApi.follow(userId)
      toast.success('درخواست دنبال کردن ارسال شد')
    } catch {
      toast.error('خطا در دنبال کردن')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <MobileTopBar />

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:max-w-[1100px] lg:mx-auto lg:px-6 lg:pt-6">
        {/* Main feed column */}
        <main className="feed-container lg:max-w-none border-x border-vista-border dark:border-vista-border-dark lg:rounded-2xl lg:overflow-hidden lg:border lg:bg-vista-surface dark:lg:bg-vista-surface-dark">
          {/* Stories */}
          <StoryBar />

          {/* Tabs */}
          <div className="sticky top-0 lg:top-0 z-30 bg-vista-bg/90 dark:bg-vista-bg-dark/90 backdrop-blur-xl border-b border-vista-border dark:border-vista-border-dark">
            <div className="flex">
              {([
                { id: 'forYou' as const, label: 'برای شما' },
                { id: 'following' as const, label: 'دنبال‌شده‌ها' },
              ]).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'flex-1 py-3.5 text-sm font-semibold relative transition-colors',
                    tab === id
                      ? 'text-vista-text-primary dark:text-vista-text-primary-dark'
                      : 'text-vista-text-secondary dark:text-vista-text-secondary-dark hover:text-vista-primary'
                  )}
                >
                  {label}
                  {tab === id && (
                    <span className="absolute bottom-0 inset-x-4 h-0.5 bg-vista-gradient rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <FeedList key={tab} tab={tab} user={user} />
        </main>

        <SuggestedUsersPanel
          users={suggested}
          currentUserId={user?.id}
          onFollow={handleFollow}
        />
      </div>
    </>
  )
}
