'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Globe, Heart, MessageSquare, Pencil, Share2, Smartphone, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PostWithProfile } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { usePostStats } from '@/hooks/usePostStats';
import { CommentSheet } from './CommentSheet';
import { PostMenu } from './PostMenu';
import { SignUpPrompt } from './SignUpPrompt';
import GoldenTickBadge from './GoldenTickBadge';
import { ProgressiveImage } from './ProgressiveImage';
import { useOptimisticPost } from '@/hooks/useOptimisticPost';
import { MusicPlayerCard } from './MusicPlayerCard';
import { postApi } from '@/lib/backendApi';
import { toast } from 'sonner';

interface PostCardProps {
    post: PostWithProfile;
    onUpdate?: (updatedPost: PostWithProfile) => void;
    onPostDeleted?: () => void;
    showComments?: boolean;
    className?: string;
}

export function PostCard({ post, onUpdate, onPostDeleted, showComments = false, className = '' }: PostCardProps) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
    const [showCommentSheet, setShowCommentSheet] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
    const [signUpAction, setSignUpAction] = useState<'like' | 'comment' | 'general'>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [localPost, setLocalPost] = useState(post);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);
    const { likePost } = useOptimisticPost();

    const { likesCount, commentsCount, refreshStats } = usePostStats({
        postId: post.id,
        initialLikesCount: post.likes_count || 0,
        initialCommentsCount: post.comments_count || 0,
        enabled: Boolean(user),
    });

    const p = localPost.profiles;

    const hasGoldenTick = p?.verification_type === 'goldTick' || p?.verification_type === 'gold';

    // Detect if user is on mobile
    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        setIsLiked(post.is_liked ?? false);
        setLocalPost(post);
    }, [post]);

    const handleLike = async () => {
        if (!user || !profile || isLikeLoading) {
            // Show sign up prompt for non-authenticated users
            if (!user || !profile) {
                setSignUpAction('like');
                setShowSignUpPrompt(true);
            }
            return;
        }

        setIsLikeLoading(true);
        
        await likePost(localPost.id, {
            ...localPost,
            is_liked: isLiked,
            likes_count: likesCount,
        });

        // Update local state
        setIsLiked(!isLiked);
        
        // Refresh stats from database
        await refreshStats();
        
        setIsLikeLoading(false);
    };

    const handleCommentClick = () => {
        if (!user || !profile) {
            setSignUpAction('comment');
            setShowSignUpPrompt(true);
            return;
        }
        setShowCommentSheet(true);
    };

    const handleCommentSheetClose = () => {
        setShowCommentSheet(false);
        refreshStats();
    };

    const generateShareUrl = (type: 'web' | 'app') => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coffevista.ir';
        const username = p?.username ? `?u=${encodeURIComponent(p.username)}` : '';
        const postUrl = `${baseUrl}/post/${localPost.id}${username}`;

        if (type === 'app') {
            return `vista://post/${localPost.id}`;
        }

        return postUrl;
    };

    const handleShare = async (type: 'web' | 'app' = 'web') => {
        const shareUrl = generateShareUrl(type);
        const shareText = `${p?.full_name || p?.username} در ویستا نوشت:\n\n${localPost.content?.substring(0, 100)}${localPost.content && localPost.content.length > 100 ? '...' : ''}\n\n${shareUrl}`;

        if (navigator.share && isMobile) {
            try {
                await navigator.share({
                    title: 'پست ویستا',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.log('Share cancelled or failed');
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
                // Fallback: open in new tab
                window.open(shareUrl, '_blank');
            }
        }
        setShowShareOptions(false);
    };

    const handleStartEdit = () => {
        setEditContent(localPost.content || '');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        const trimmed = editContent.trim();
        if (!trimmed) return;
        setIsSavingEdit(true);
        try {
            const updated = await postApi.update(localPost.id, trimmed);
            setLocalPost({ ...updated, is_edited: true });
            onUpdate?.(updated);
            setIsEditing(false);
            toast.success('پست ویرایش شد');
        } catch {
            toast.error('خطا در ویرایش پست');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'همین الان';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} دقیقه پیش`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ساعت پیش`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} روز پیش`;
        } else {
            return date.toLocaleDateString('fa-IR');
        }
    };

    return (
        <>
            <div className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
                {/* User Info */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => {
                            if (p?.username) {
                                router.push(`/profile/${p.username}`);
                            }
                        }}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 text-right"
                    >
                        {p?.avatar_url ? (
                            <img
                                src={p.avatar_url}
                                alt="avatar"
                                className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-400 cursor-pointer">
                                {p?.full_name?.charAt(0) || p?.username?.charAt(0) || '👤'}
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {p?.full_name || p?.username}
                                </h3>
                                {hasGoldenTick && <GoldenTickBadge size="sm" />}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">@{p?.username}</span> • {formatTimeAgo(localPost.created_at)}
                            </p>
                        </div>
                    </button>
                    {user && (
                        <PostMenu
                            post={localPost}
                            currentUserId={user.id}
                            onPostDeleted={onPostDeleted}
                            onEdit={handleStartEdit}
                        />
                    )}
                </div>

                {/* Post Content */}
                {isEditing ? (
                    <div className="mb-4">
                        <textarea
                            ref={editTextareaRef}
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-vista-primary/40 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-vista-primary/30"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                            <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                            >
                                <X className="w-3.5 h-3.5" />
                                انصراف
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit || !editContent.trim()}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-vista-primary text-white hover:opacity-90 transition disabled:opacity-50"
                            >
                                <Check className="w-3.5 h-3.5" />
                                {isSavingEdit ? 'در حال ذخیره...' : 'ذخیره'}
                            </button>
                        </div>
                    </div>
                ) : (
                    localPost.content && (
                        <div className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-line leading-relaxed">
                            {localPost.content}
                            {localPost.is_edited && (
                                <span className="inline-flex items-center gap-1 mr-2 text-xs text-zinc-400 dark:text-zinc-500">
                                    <Pencil className="w-3 h-3" />
                                    ویرایش شده
                                </span>
                            )}
                        </div>
                    )
                )}

                {/* Post Media */}
                {localPost.image_url && (
                    <div className="mb-4 overflow-auto">
                        <ProgressiveImage
                            src={localPost.image_url!}
                            alt="post"
                            className="rounded-xl border border-zinc-200 dark:border-zinc-700"
                        />
                    </div>
                )}

                {localPost.video_url && (
                    <div className="mb-4 overflow-auto">
                        <video
                            src={localPost.video_url!}
                            controls
                            className="rounded-xl border border-zinc-200 dark:border-zinc-700"
                            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                        >
                            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                        </video>
                    </div>
                )}

                {localPost.music_url && (
                    <div className="mb-4">
                        <MusicPlayerCard
                            src={localPost.music_url!}
                            postId={localPost.id}
                            title={localPost.content?.split('\n')[0]?.substring(0, 60) || undefined}
                            coverUrl={localPost.profiles?.avatar_url || undefined}
                            artist={localPost.profiles?.full_name || localPost.profiles?.username || undefined}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-6">
                        {/* Like Button */}
                        <button
                            onClick={handleLike}
                            disabled={isLikeLoading || !user || !profile}
                            className={`flex items-center gap-2 transition ${user && profile
                                ? 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                                : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                                } disabled:opacity-50`}
                        >
                            <Heart
                                className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                            />
                            <span className="text-sm font-medium">
                                {likesCount}
                            </span>
                        </button>

                        {/* Comment Button */}
                        <button
                            onClick={handleCommentClick}
                            disabled={!user || !profile}
                            className={`flex items-center gap-2 transition ${user && profile
                                ? 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                                : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                                } disabled:opacity-50`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {commentsCount}
                            </span>
                        </button>

                        {/* Share Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowShareOptions(!showShareOptions)}
                                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm font-medium">اشتراک‌گذاری</span>
                            </button>

                            {/* Share Options Dropdown */}
                            {showShareOptions && (
                                <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-2 min-w-[200px] z-10">
                                    <button
                                        onClick={() => handleShare('web')}
                                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                                    >
                                        <Globe className="w-4 h-4" />
                                        کپی لینک
                                    </button>
                                    {isMobile && (
                                        <button
                                            onClick={() => handleShare('app')}
                                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                                        >
                                            <Smartphone className="w-4 h-4" />
                                            اشتراک‌گذاری در اپ
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Copy Success Indicator */}
                    {copied && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                            <Check className="w-4 h-4" />
                            کپی شد!
                        </div>
                    )}
                </div>
            </div>

            {/* Comment Sheet */}
            <CommentSheet
                isOpen={showCommentSheet}
                onClose={handleCommentSheetClose}
                post={localPost}
                onUpdate={onUpdate}
            />

            {/* Sign Up Prompt */}
            <SignUpPrompt
                isOpen={showSignUpPrompt}
                onClose={() => setShowSignUpPrompt(false)}
                action={signUpAction}
            />
        </>
    );
} 
