'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PostWithProfile } from '@/lib/types';
import { PostService } from '@/lib/postService';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/ui/PostCard';
import { ArrowLeft, Share2, Check, Smartphone, Globe } from 'lucide-react';
import { GuestJoinBanner } from '@/components/ui/GuestJoinBanner';
import { Logo } from '@/components/ui/Logo';

function cleanPostId(raw: string | undefined): string | null {
    if (!raw) return null;
    const decoded = decodeURIComponent(raw).replace(/%5B|%5D/g, '').replace(/\[|\]/g, '');
    if (!decoded || decoded === 'id' || decoded === 'undefined' || decoded === 'null' || decoded.length < 3) {
        return null;
    }
    return decoded;
}

export default function PostDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const [post, setPost] = useState<PostWithProfile | null>(null);
    const [loadingPost, setLoadingPost] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const postId = cleanPostId(params.id as string);
    const isGuest = !authLoading && !user;

    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) {
                setError('شناسه پست نامعتبر است');
                setLoadingPost(false);
                return;
            }

            setLoadingPost(true);
            setError(null);

            try {
                const hints = {
                    username: searchParams.get('u') || searchParams.get('username') || undefined,
                    userId: searchParams.get('userId') || searchParams.get('user') || undefined,
                };
                const postData = await PostService.getPost(postId, user?.id, hints);
                if (!postData) {
                    setError('پست مورد نظر یافت نشد یا در دسترس نیست');
                    setPost(null);
                    return;
                }
                setPost(postData);
            } catch {
                setError('خطا در بارگذاری پست');
                setPost(null);
            } finally {
                setLoadingPost(false);
            }
        };

        if (!authLoading) {
            fetchPost();
        }
    }, [postId, user?.id, authLoading, searchParams]);

    const generateShareUrl = (type: 'web' | 'app') => {
        const baseUrl = window.location.origin;
        if (type === 'app') {
            return `vista://post/${postId}`;
        }
        return `${baseUrl}/post/${postId}`;
    };

    const handleShare = async (type: 'web' | 'app' = 'web') => {
        const shareUrl = generateShareUrl(type);
        const shareText = post?.content?.substring(0, 100) + '...';

        try {
            if (navigator.share && type === 'web') {
                await navigator.share({
                    title: 'پست Vista',
                    text: shareText,
                    url: shareUrl,
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // ignore clipboard errors
            }
        }
        setShowShareOptions(false);
    };

    const handlePostUpdate = (updatedPost: PostWithProfile) => {
        setPost(updatedPost);
    };

    const handlePostDeleted = () => {
        if (user) {
            router.replace('/feed');
        } else {
            router.replace('/auth');
        }
    };

    if (loadingPost || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری پست...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
                {isGuest && (
                    <header className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                            <button type="button" onClick={() => router.push('/auth')} className="flex items-center gap-2">
                                <Logo size="sm" />
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/auth')}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                ورود
                            </button>
                        </div>
                    </header>
                )}
                <div className="flex items-center justify-center min-h-[60vh] px-4">
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {error || 'پست مورد نظر یافت نشد'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                            ممکن است این پست حذف شده، مربوط به حساب خصوصی باشد یا در دسترس نباشد
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => router.back()}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                            >
                                بازگشت
                            </button>
                            {!user && (
                                <button
                                    onClick={() => router.push('/auth')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    ورود به ویستا
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {isGuest && <GuestJoinBanner />}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            <header className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                {isGuest && (
                    <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => router.push('/auth')}
                            className="flex items-center gap-2"
                        >
                            <Logo size="sm" />
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/auth')}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            ورود
                        </button>
                    </div>
                )}
                <div className="flex items-center justify-between p-3 md:p-4 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 md:gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">بازگشت</span>
                    </button>
                    <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">پست</h1>
                    <div className="relative">
                        <button
                            onClick={() => setShowShareOptions(!showShareOptions)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : (
                                <Share2 className="w-5 h-5" />
                            )}
                        </button>

                        {showShareOptions && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-20">
                                <div className="p-2">
                                    <button
                                        onClick={() => handleShare('web')}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition"
                                    >
                                        <Globe className="w-4 h-4" />
                                        <span>اشتراک‌گذاری وب</span>
                                    </button>
                                    {isMobile && (
                                        <button
                                            onClick={() => handleShare('app')}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition"
                                        >
                                            <Smartphone className="w-4 h-4" />
                                            <span>اشتراک‌گذاری اپ</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className={`max-w-2xl mx-auto p-4 ${isGuest ? 'pb-28' : 'pb-4'}`}>
                <PostCard
                    post={post}
                    onUpdate={handlePostUpdate}
                    onPostDeleted={handlePostDeleted}
                    showComments={Boolean(user && profile)}
                />
            </div>

            {isGuest && (
                <GuestJoinBanner
                    title="این پست رو دوست داشتی؟"
                    description="به ویستا بپیوند تا لایک کنی، کامنت بذاری و با دیگران ارتباط بگیری"
                />
            )}

            {showShareOptions && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowShareOptions(false)}
                />
            )}
        </div>
    );
}
