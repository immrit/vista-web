"use client";
import { Profile, Post } from '@/lib/supabase';
import { Music, MessageSquare, Heart } from 'lucide-react';
import { useState } from 'react';

interface PostWithProfile extends Post {
    profiles?: Profile;
}

export default function ProfileTabsUI({ profile, posts, musicPosts, lang, isRtl }: {
    profile: Profile;
    posts: PostWithProfile[];
    musicPosts: PostWithProfile[];
    lang: 'fa' | 'en';
    isRtl: boolean;
}) {
    const [activeTab, setActiveTab] = useState<'posts' | 'music'>('posts');
    return (
        <div className={`min-h-screen dark:bg-zinc-950 bg-gray-50 flex flex-col md:flex-row relative`} dir={isRtl ? 'rtl' : 'ltr'}>
            <main className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-8 py-8 pb-20 md:pb-8 pt-16 md:pt-8">
                <div className="w-full max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center md:items-start">
                                <div className="relative">
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="آواتار"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-zinc-200 dark:border-zinc-700"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-4xl font-bold text-zinc-600 dark:text-zinc-300 border-4 border-zinc-200 dark:border-zinc-700">
                                            {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '👤'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Profile Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {profile.full_name || profile.username}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mb-3">@{profile.username}</p>
                                {profile.bio && (
                                    <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                                        {profile.bio}
                                    </p>
                                )}
                                {/* Join Date */}
                                {profile.created_at && (
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                                        <span>عضویت از {new Date(profile.created_at).toLocaleDateString('fa-IR')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
                        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`flex-1 py-4 px-6 text-center font-medium transition ${activeTab === 'posts'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                پست‌ها ({posts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('music')}
                                className={`flex-1 py-4 px-6 text-center font-medium transition flex items-center justify-center gap-2 ${activeTab === 'music'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Music className="w-4 h-4" />
                                موزیک ({musicPosts.length})
                            </button>
                        </div>
                    </div>
                    {/* Posts Content */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                        {activeTab === 'posts' ? (
                            posts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    هنوز پستی منتشر نکرده است.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {posts.map(post => (
                                        <ProfilePostCard key={post.id} post={post} />
                                    ))}
                                </div>
                            )
                        ) : (
                            musicPosts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Music className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    هنوز موزیکی منتشر نکرده است.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {musicPosts.map(post => (
                                        <ProfilePostCard key={post.id} post={post} showMusicPlayer />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ProfilePostCard({ post, showMusicPlayer = false }: { post: PostWithProfile; showMusicPlayer?: boolean }) {
    const p = post.profiles;
    return (
        <div className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 pb-6 last:pb-0">
            <div className="flex items-center mb-3">
                {p?.avatar_url ? (
                    <img src={p.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 ml-3" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-600 dark:text-zinc-300 ml-3">
                        {p?.full_name?.charAt(0) || p?.username?.charAt(0) || '👤'}
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{p?.full_name || p?.username || 'کاربر'}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">@{p?.username || 'user'}</span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(post.created_at).toLocaleDateString('fa-IR')}</div>
                </div>
            </div>
            {post.content && (
                <div className="text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-line">{post.content}</div>
            )}
            {post.image_url && (
                <img src={post.image_url} alt="post" className="rounded-xl max-h-80 w-full object-cover border border-zinc-200 dark:border-zinc-700 mb-3" />
            )}
            {showMusicPlayer && post.music_url && (
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 mb-3 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Music className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-700 dark:text-purple-300">فایل صوتی</span>
                    </div>
                    <audio controls className="w-full">
                        <source src={post.music_url} type="audio/mpeg" />
                        مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                    </audio>
                </div>
            )}
            <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400 text-sm">
                <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments_count}</span>
                </div>
            </div>
        </div>
    );
} 