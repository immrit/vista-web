'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { supabase, Post, Profile } from '@/lib/supabase'
import { Navigation } from '@/components/ui/Navigation'
import { PostCard } from '@/components/ui/PostCard'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PostWithProfile extends Post {
    profiles?: Profile;
}

export default function FeedPage() {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const [posts, setPosts] = useState<PostWithProfile[]>([])
    const [loadingPosts, setLoadingPosts] = useState(true)
    const [suggested, setSuggested] = useState<Profile[]>([])
    const lang = 'fa'
    const isRtl = lang === 'fa'

    // اگر loading تمام شد و کاربر لاگین نکرده، به auth redirect کن
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth')
        }
    }, [user, loading, router])

    useEffect(() => {
        const fetchPosts = async () => {
            setLoadingPosts(true)
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles:profiles!posts_user_id_fkey(*)')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(10)
            if (!error && data) setPosts(data as PostWithProfile[])
            setLoadingPosts(false)
        }
        fetchPosts()
    }, [])

    useEffect(() => {
        const fetchSuggested = async () => {
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
        }
        fetchSuggested()
    }, [])

    const handlePostUpdate = (updatedPost: PostWithProfile) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
    };

    // اگر هنوز loading است یا کاربر لاگین نکرده، loading screen نشان بده
    if (loading || !user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen dark:bg-zinc-950 bg-gray-50 flex flex-col md:flex-row relative`} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Navigation: Always render for bottom nav on mobile, sidebar on desktop */}
            <Navigation lang={lang} user={profile} />
            {/* TopBar (Mobile only) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-center border-b border-zinc-800 dark:bg-zinc-950 bg-white shadow-sm">
                {/* Bell icon right */}
                <button className="absolute right-4 p-2 rounded-full hover:bg-zinc-900 transition">
                    <Bell className="w-7 h-7 text-white" />
                </button>
                {/* Vista center */}
                <span className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-white select-none font-bauhaus">Vista</span>
            </div>
            {/* Sidebar (Desktop only) */}
            <div className={`hidden md:flex flex-col min-w-[220px] shrink-0 ${isRtl ? 'order-3' : 'order-1'}`}></div>
            {/* Feed */}
            <main className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-8 py-8 pb-20 md:pb-8 pt-16 md:pt-8">
                <div className="w-full max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4 dark:text-white text-gray-900">فید</h2>
                        {loadingPosts ? (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">در حال بارگذاری پست‌ها...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">پستی برای نمایش وجود ندارد.</div>
                        ) : (
                            <div className="space-y-6">
                                {posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onUpdate={handlePostUpdate}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {/* Suggestions */}
            <aside className={`hidden lg:flex flex-col min-w-[300px] shrink-0 px-4 py-8 ${isRtl ? 'order-1' : 'order-3'}`}>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-4 dark:text-white text-gray-900">پیشنهاد برای دنبال کردن</h3>
                    <ul className="space-y-4">
                        {suggested.map(user => (
                            <li key={user.id} className="flex items-center gap-3">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-800" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl text-white font-bold">
                                        {user.full_name?.charAt(0) || user.username?.charAt(0) || '👤'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 dark:text-white truncate">{user.full_name || user.username}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">@{user.username}</div>
                                </div>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1">دنبال کن</Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </div>
    )
}
