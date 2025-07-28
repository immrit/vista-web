'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { supabase, Post, Profile, Like, Comment } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePostStats } from '@/hooks/usePostStats';
import { CommentSheet } from './CommentSheet';
import { PostMenu } from './PostMenu';

interface PostWithProfile extends Post {
    profiles?: Profile;
}

interface PostCardProps {
    post: PostWithProfile;
    onUpdate?: (updatedPost: PostWithProfile) => void;
    onPostDeleted?: () => void;
    showComments?: boolean;
    className?: string;
}

export function PostCard({ post, onUpdate, onPostDeleted, showComments = false, className = '' }: PostCardProps) {
    const { user, profile } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [showCommentSheet, setShowCommentSheet] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    const { likesCount, commentsCount, refreshStats } = usePostStats({
        postId: post.id,
        initialLikesCount: 0, // Start with 0, will be loaded from database
        initialCommentsCount: 0 // Start with 0, will be loaded from database
    });

    const p = post.profiles;

    // Check if current user has liked this post
    useEffect(() => {
        if (user && post.id) {
            checkIfLiked();
        }
    }, [user, post.id]);

    const checkIfLiked = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();

            setIsLiked(!!data);
        } catch (error) {
            // If no like found, it's not liked
            setIsLiked(false);
        }
    };

    const handleLike = async () => {
        if (!user || !profile || isLikeLoading) return;

        setIsLikeLoading(true);
        try {
            if (isLiked) {
                // Unlike
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', user.id);

                if (!error) {
                    setIsLiked(false);
                    // Refresh stats from database
                    await refreshStats();
                }
            } else {
                // Like
                const { error } = await supabase
                    .from('likes')
                    .insert({
                        post_id: post.id,
                        user_id: user.id,
                        owner_id: post.user_id
                    });

                if (!error) {
                    setIsLiked(true);
                    // Refresh stats from database
                    await refreshStats();
                }
            }
        } catch (error) {
            console.error('Error handling like:', error);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleCommentClick = () => {
        setShowCommentSheet(true);
    };

    const handleCommentSheetClose = () => {
        setShowCommentSheet(false);
        // Refresh comment count when sheet closes
        refreshStats();
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'الان';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقیقه پیش`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعت پیش`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} روز پیش`;

        return date.toLocaleDateString('fa-IR');
    };

    return (
        <>
            <div className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {p?.avatar_url ? (
                            <img
                                src={p.avatar_url}
                                alt="avatar"
                                className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                {p?.full_name?.charAt(0) || p?.username?.charAt(0) || '👤'}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {p?.full_name || p?.username || 'کاربر'}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    @{p?.username || 'user'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(post.created_at)}
                            </div>
                        </div>
                    </div>
                    {user && (
                        <PostMenu
                            post={post}
                            currentUserId={user.id}
                            onPostDeleted={onPostDeleted}
                        />
                    )}
                </div>

                {/* Post Content */}
                {post.content && (
                    <div className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-line leading-relaxed">
                        {post.content}
                    </div>
                )}

                {/* Post Media */}
                {post.image_url && (
                    <div className="mb-4 overflow-auto">
                        <img
                            src={post.image_url}
                            alt="post"
                            className="rounded-xl border border-zinc-200 dark:border-zinc-700"
                            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                )}

                {/* Video Player */}
                {post.video_url && (
                    <div className="mb-4 overflow-auto">
                        <video
                            src={post.video_url}
                            controls
                            className="rounded-xl border border-zinc-200 dark:border-zinc-700"
                            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                        >
                            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                        </video>
                    </div>
                )}

                {/* Music Player */}
                {post.music_url && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">♪</span>
                            </div>
                            <span className="font-medium text-purple-700 dark:text-purple-300">فایل صوتی</span>
                        </div>
                        <audio controls className="w-full">
                            <source src={post.music_url} type="audio/mpeg" />
                            مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                        </audio>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-6">
                        {/* Like Button */}
                        <button
                            onClick={handleLike}
                            disabled={isLikeLoading}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full transition ${isLiked
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                } ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm font-medium">{likesCount}</span>
                        </button>

                        {/* Comment Button */}
                        <button
                            onClick={handleCommentClick}
                            className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium">{commentsCount}</span>
                        </button>

                        {/* Share Button */}
                        <button className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">اشتراک</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comment Sheet */}
            <CommentSheet
                isOpen={showCommentSheet}
                onClose={handleCommentSheetClose}
                postId={post.id}
                postOwnerId={post.user_id}
            />
        </>
    );
} 