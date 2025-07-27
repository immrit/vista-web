"use client";
import { Profile, Post } from '@/lib/supabase';
import { Music, MessageSquare, Heart } from 'lucide-react';
import { useState } from 'react';
import { PostCard } from '@/components/ui/PostCard';

interface PostWithProfile extends Post {
    profiles?: Profile;
}

export default function ProfileTabsUI({ profile, posts, musicPosts, isRtl }: {
    profile: Profile;
    posts: PostWithProfile[];
    musicPosts: PostWithProfile[];
    isRtl: boolean;
}) {
    const [activeTab, setActiveTab] = useState<'posts' | 'music'>('posts');
    const [localPosts, setLocalPosts] = useState(posts);
    const [localMusicPosts, setLocalMusicPosts] = useState(musicPosts);

    const handlePostUpdate = (updatedPost: PostWithProfile) => {
        setLocalPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
        setLocalMusicPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
    };

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
                                پست‌ها ({localPosts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('music')}
                                className={`flex-1 py-4 px-6 text-center font-medium transition flex items-center justify-center gap-2 ${activeTab === 'music'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Music className="w-4 h-4" />
                                موزیک ({localMusicPosts.length})
                            </button>
                        </div>
                    </div>
                    {/* Posts Content */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                        {activeTab === 'posts' ? (
                            localPosts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    هنوز پستی منتشر نکرده است.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {localPosts.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onUpdate={handlePostUpdate}
                                        />
                                    ))}
                                </div>
                            )
                        ) : (
                            localMusicPosts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Music className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    هنوز موزیکی منتشر نکرده است.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {localMusicPosts.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onUpdate={handlePostUpdate}
                                        />
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