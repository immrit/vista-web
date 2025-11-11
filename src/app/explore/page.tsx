'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase, Post, Profile } from '@/lib/supabase'
import { Navigation } from '@/components/ui/Navigation'
import { PostCard } from '@/components/ui/PostCard'
import { Search, Hash, User, TrendingUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PostWithProfile extends Post {
    profiles?: Profile;
}

export default function ExplorePage() {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryParam = searchParams.get('q') || ''
    
    const [searchQuery, setSearchQuery] = useState(queryParam)
    const [searchResults, setSearchResults] = useState<PostWithProfile[]>([])
    const [users, setUsers] = useState<Profile[]>([])
    const [hashtags, setHashtags] = useState<{ tag: string; count: number }[]>([])
    const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'hashtags'>('posts')
    const [authChecked, setAuthChecked] = useState(false)
    
    const lang = 'fa'
    const isRtl = lang === 'fa'

    // بررسی authentication
    useEffect(() => {
        if (!loading && !user && authChecked) {
            router.replace('/auth')
        }
    }, [user, loading, router, authChecked])

    useEffect(() => {
        const authTimeout = setTimeout(() => {
            setAuthChecked(true)
        }, 1000)
        return () => clearTimeout(authTimeout)
    }, [])

    // بارگذاری هشتگ‌های ترند
    useEffect(() => {
        if (authChecked && user) {
            fetchTrendingHashtags()
        }
    }, [authChecked, user])

    // جستجو وقتی query تغییر می‌کند
    useEffect(() => {
        if (authChecked && user && searchQuery.trim()) {
            performSearch(searchQuery.trim())
        } else if (authChecked && user && !searchQuery.trim()) {
            // اگر جستجویی نیست، پست‌های محبوب را نشان بده
            fetchPopularPosts()
        }
    }, [searchQuery, authChecked, user])

    // همگام‌سازی با query parameter
    useEffect(() => {
        if (queryParam && queryParam !== searchQuery) {
            setSearchQuery(queryParam)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParam])

    const fetchTrendingHashtags = async () => {
        try {
            // TODO: Implement actual trending hashtags from database
            // For now, using mock data
            const mockHashtags = [
                { tag: 'ویستا', count: 1234 },
                { tag: 'موسیقی', count: 856 },
                { tag: 'هنر', count: 642 },
                { tag: 'عکاسی', count: 521 },
                { tag: 'طراحی', count: 489 },
            ]
            setTrendingHashtags(mockHashtags)
        } catch (error) {
            console.error('Error fetching trending hashtags:', error)
        }
    }

    const fetchPopularPosts = async () => {
        setIsSearching(true)
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles:profiles!posts_user_id_fkey(*)')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(20)

            if (!error && data) {
                setSearchResults(data as PostWithProfile[])
            }
        } catch (error) {
            console.error('Error fetching popular posts:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const performSearch = async (query: string) => {
        setIsSearching(true)
        try {
            // جستجوی پست‌ها
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('*, profiles:profiles!posts_user_id_fkey(*)')
                .eq('status', 'published')
                .or(`content.ilike.%${query}%,caption.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(50)

            if (!postsError && postsData) {
                setSearchResults(postsData as PostWithProfile[])
            }

            // جستجوی کاربران
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                .limit(20)

            if (!usersError && usersData) {
                setUsers(usersData as Profile[])
            }

            // استخراج هشتگ‌ها از query
            const hashtagMatches = query.match(/#[\w\u0600-\u06FF]+/g)
            if (hashtagMatches) {
                const hashtagList = hashtagMatches.map(tag => ({
                    tag: tag.replace('#', ''),
                    count: 0 // TODO: Get actual count from database
                }))
                setHashtags(hashtagList)
            } else {
                setHashtags([])
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
            performSearch(searchQuery.trim())
        }
    }

    const handleHashtagClick = (tag: string) => {
        setSearchQuery(`#${tag}`)
        router.push(`/explore?q=${encodeURIComponent(`#${tag}`)}`)
    }

    if (!authChecked || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen dark:bg-zinc-950 bg-gray-50 flex flex-col lg:flex-row relative`} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Navigation */}
            <Navigation lang={lang} user={profile || undefined} />

            {/* TopBar (Mobile only) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-center border-b border-zinc-800 dark:bg-zinc-950 bg-white shadow-sm">
                <span className="text-2xl font-bold text-white select-none font-bauhaus">جستجو</span>
            </div>

            {/* Main Content */}
            <div className={`flex-1 ${!authChecked ? '' : 'md:mr-[220px]'} pt-16 lg:pt-0`}>
                <div className="max-w-4xl mx-auto px-4 py-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative">
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="جستجوی کاربران، هشتگ‌ها، پست‌ها..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 pr-12 py-3 text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all"
                            />
                        </div>
                    </form>

                    {/* Tabs */}
                    {searchQuery && (
                        <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'posts'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                پست‌ها
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'users'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                کاربران
                            </button>
                            <button
                                onClick={() => setActiveTab('hashtags')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'hashtags'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                هشتگ‌ها
                            </button>
                        </div>
                    )}

                    {/* Trending Hashtags (when no search) */}
                    {!searchQuery && trendingHashtags.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">هشتگ‌های ترند</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {trendingHashtags.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleHashtagClick(item.tag)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <Hash className="w-4 h-4 text-blue-500" />
                                        <span className="text-zinc-900 dark:text-white font-medium">#{item.tag}</span>
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {isSearching ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Posts Tab */}
                            {(!searchQuery || activeTab === 'posts') && (
                                <div className="space-y-4">
                                    {searchResults.length > 0 ? (
                                        searchResults.map((post) => (
                                            <PostCard key={post.id} post={post} />
                                        ))
                                    ) : searchQuery ? (
                                        <div className="text-center py-12">
                                            <Search className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                                            <p className="text-zinc-600 dark:text-zinc-400">نتیجه‌ای یافت نشد</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Users Tab */}
                            {searchQuery && activeTab === 'users' && (
                                <div className="space-y-3">
                                    {users.length > 0 ? (
                                        users.map((userProfile) => (
                                            <button
                                                key={userProfile.id}
                                                onClick={() => router.push(`/profile/${userProfile.username}`)}
                                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                {userProfile.avatar_url ? (
                                                    <img
                                                        src={userProfile.avatar_url}
                                                        alt={userProfile.full_name || userProfile.username || 'User'}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                                        <User className="w-6 h-6 text-zinc-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 text-right">
                                                    <div className="font-semibold text-zinc-900 dark:text-white">
                                                        {userProfile.full_name || userProfile.username}
                                                    </div>
                                                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        @{userProfile.username}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <User className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                                            <p className="text-zinc-600 dark:text-zinc-400">کاربری یافت نشد</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hashtags Tab */}
                            {searchQuery && activeTab === 'hashtags' && (
                                <div className="space-y-3">
                                    {hashtags.length > 0 ? (
                                        hashtags.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleHashtagClick(item.tag)}
                                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Hash className="w-5 h-5 text-blue-500" />
                                                    <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                                                        #{item.tag}
                                                    </span>
                                                </div>
                                                {item.count > 0 && (
                                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {item.count} پست
                                                    </span>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <Hash className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                                            <p className="text-zinc-600 dark:text-zinc-400">هشتگی یافت نشد</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

