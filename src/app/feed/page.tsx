'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Profile } from '@/lib/supabase'
import { Navigation } from '@/components/ui/Navigation'
import { PostCard } from '@/components/ui/PostCard'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useInfinitePosts } from '@/hooks/useInfinitePosts'
import { useOptimisticPost } from '@/hooks/useOptimisticPost'
import { PostErrorBoundary } from '@/components/ErrorBoundary'
import { postPreloader } from '@/lib/preloader/PostPreloader'
import { performanceMonitor } from '@/lib/analytics/PerformanceMonitor'
import { usePresence } from '@/hooks/usePresence'

interface PostWithProfile {
  id: string;
  content?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  music_url?: string | null;
  created_at: string;
  user_id: string;
  status: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  profiles?: Profile;
}

export default function FeedPage() {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const [suggested, setSuggested] = useState<Profile[]>([])
    const [authChecked, setAuthChecked] = useState(false)
    const lang = 'fa'
    const isRtl = lang === 'fa'
    const loadStartTime = useRef<number>(Date.now())
    const { isUserOnline } = usePresence()

    // استفاده از React Query برای infinite scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useInfinitePosts()

    // استفاده از Optimistic Updates
    const { applyOptimisticUpdates } = useOptimisticPost()

    // Track performance
    useEffect(() => {
        if (!isLoading && data) {
            const loadTime = Date.now() - loadStartTime.current
            performanceMonitor.trackFeedLoad(loadTime, {
                postsCount: data.pages.reduce((acc, page) => acc + page.posts.length, 0),
            })
        }
    }, [isLoading, data])

    // بررسی authentication با منطق بهتر
    useEffect(() => {
        if (!loading && !user && authChecked) {
            router.replace('/auth')
        }
    }, [user, loading, router, authChecked, profile])

    // تنظیم authChecked بعد از 1 ثانیه
    useEffect(() => {
        const authTimeout = setTimeout(() => {
            setAuthChecked(true)
        }, 1000)

        return () => clearTimeout(authTimeout)
    }, [])

    // بارگذاری کاربران پیشنهادی
    useEffect(() => {
        if (authChecked && user) {
            fetchSuggested()
        }
    }, [authChecked, user])

    const fetchSuggested = async () => {
        try {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            
            const { data: top } = await supabase
                .from('profiles')
                .select('*')
                .order('followers_count', { ascending: false })
                .limit(5)
            const { data: random } = await supabase
                .from('profiles')
                .select('*')
                .order('random()')
                .limit(3)
            let all: Profile[] = []
            if (top) all = [...top]
            if (random) {
                random.forEach(r => {
                    if (!all.find(u => u.id === r.id)) all.push(r)
                })
            }
            setSuggested(all)
        } catch (err) {
            console.error('Failed to fetch suggested users:', err)
        }
    }

    // Intersection Observer برای lazy loading
    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                        fetchNextPage()
                    }
                })
            },
            {
                rootMargin: '100px',
                threshold: 0.1
            }
        )

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current)
            }
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    // Preload next posts on hover
    const handlePostHover = useCallback((index: number) => {
        const allPosts = data?.pages.flatMap(page => page.posts) || []
        postPreloader.preloadNext(index, allPosts)
    }, [data])

    // Merge all posts from pages
    const allPosts = data?.pages.flatMap(page => page.posts) || []
    const displayPosts = applyOptimisticUpdates(allPosts as PostWithProfile[])

    const handlePostUpdate = (updatedPost: PostWithProfile) => {
        // React Query will handle this automatically through cache invalidation
        refetch()
    }

    const handlePostDeleted = () => {
        refetch()
    }

    // اگر هنوز loading است، loading screen نشان بده
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
                </div>
            </div>
        )
    }

    // اگر هنوز authChecked نشده، loading نشان بده
    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">در حال بررسی احراز هویت...</p>
                </div>
            </div>
        )
    }

    // اگر authentication check تمام شد و کاربر لاگین نکرده، loading نشان بده تا redirect شود
    if (authChecked && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">در حال هدایت به صفحه ورود...</p>
                </div>
            </div>
        )
    }

    // اگر کاربر لاگین کرده ولی profile ندارد، loading نشان بده
    if (user && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری پروفایل...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen dark:bg-zinc-950 bg-gray-50 flex flex-col lg:flex-row relative`} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Navigation: Always render for bottom nav on mobile, sidebar on desktop */}
            <Navigation lang={lang} user={profile || undefined} />
            {/* TopBar (Mobile only) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-center border-b border-zinc-800 dark:bg-zinc-950 bg-white shadow-sm">
                {/* Bell icon right */}
                <button className="absolute right-4 p-2 rounded-full hover:bg-zinc-900 transition">
                    <Bell className="w-7 h-7 text-white" />
                </button>
                {/* Vista center */}
                <span className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-white select-none font-bauhaus">Vista</span>
            </div>
            {/* Suggested Users (Desktop only) - Left Side */}
            <div className={`hidden lg:flex flex-col min-w-[280px] shrink-0 ${isRtl ? 'order-3' : 'order-1'}`}>
                <div className="sticky top-4 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">کاربران پیشنهادی</h3>
                            <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                                مشاهده همه
                            </button>
                        </div>
                        <div className="space-y-3">
                            {suggested.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer group"
                                    onClick={() => router.push(`/profile/${user.username}`)}
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:scale-105 transition-transform duration-200">
                                            {user.full_name?.charAt(0) || user.username?.charAt(0) || '👤'}
                                        </div>
                                        {isUserOnline(user.id) && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {user.full_name || user.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            @{user.username}
                                        </p>
                                        {user.followers_count && user.followers_count > 0 && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                {user.followers_count.toLocaleString('fa-IR')} دنبال‌کننده
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Implement follow functionality
                                            console.log('Follow user:', user.username);
                                        }}
                                    >
                                        دنبال کن
                                    </button>
                                </div>
                            ))}
                        </div>
                        {suggested.length === 0 && (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">هیچ کاربری یافت نشد</p>
                            </div>
                        )}
                        {suggested.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-zinc-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    بر اساس علایق شما
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Feed - Center */}
            <div className={`flex-1 ${isRtl ? 'order-2' : 'order-2'} lg:ml-0`}>
                <div className="lg:pt-0 pt-16">
                    <div className="max-w-2xl mx-auto p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : error ? (
                            <PostErrorBoundary
                                onRetry={() => refetch()}
                                fallback={
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 1010 10A10 10 0 0012 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                                            در بارگذاری پست‌ها خطایی رخ داد.
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.
                                        </p>
                                        <Button
                                            onClick={() => refetch()}
                                            className="mt-5 px-5"
                                        >
                                            تلاش مجدد
                                        </Button>
                                    </div>
                                }
                            >
                                <div>Error loading posts</div>
                            </PostErrorBoundary>
                        ) : displayPosts.length > 0 ? (
                            <div className="space-y-4">
                                {displayPosts.map((post, index) => (
                                    <PostErrorBoundary key={post.id}>
                                        <div
                                            onMouseEnter={() => handlePostHover(index)}
                                        >
                                            <PostCard
                                                post={post}
                                                onUpdate={handlePostUpdate}
                                                onPostDeleted={handlePostDeleted}
                                                showComments={user && profile ? true : false}
                                            />
                                        </div>
                                    </PostErrorBoundary>
                                ))}

                                {/* Load More Trigger */}
                                <div ref={loadMoreRef} className="h-4"></div>

                                {/* Loading More Indicator */}
                                {isFetchingNextPage && (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری پست‌های بیشتر...</span>
                                        </div>
                                    </div>
                                )}

                                {/* No More Posts */}
                                {!hasNextPage && displayPosts.length > 0 && (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">پست‌های بیشتری وجود ندارد</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">شما به انتهای فید رسیده‌اید</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">هیچ پستی یافت نشد</p>
                                <p className="text-gray-500 dark:text-gray-500 text-sm">اولین نفری باشید که پست می‌گذارد!</p>
                                <button
                                    onClick={() => refetch()}
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                >
                                    تلاش مجدد
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Empty Space for Right Side (Desktop only) */}
            <div className={`hidden lg:flex flex-col min-w-[280px] shrink-0 ${isRtl ? 'order-1' : 'order-3'}`}></div>
        </div>
    )
}
