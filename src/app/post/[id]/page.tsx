'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PostWithProfile } from '@/lib/types';
import { PostService } from '@/lib/postService';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/ui/PostCard';
import { ArrowLeft, Share2, Copy, Check, Smartphone, Globe, Users, ArrowRight } from 'lucide-react';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const [post, setPost] = useState<PostWithProfile | null>(null);
    const [loadingPost, setLoadingPost] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Clean up postId - handle URL encoding issues
    const rawPostId = params.id as string;
    let postId = rawPostId ? decodeURIComponent(rawPostId).replace(/%5B|%5D/g, '').replace(/\[|\]/g, '') : null;

    // Fallback: Extract post ID from URL pathname if params.id is not working
    if (!postId || postId === 'id' || postId === 'undefined' || postId === 'null') {
        const pathname = window.location.pathname;
        const postMatch = pathname.match(/\/post\/([^\/\?]+)/);
        if (postMatch && postMatch[1]) {
            postId = postMatch[1];
            console.log('Fallback: Extracted post ID from URL:', postId);
        }
    }

    console.log('=== POST PAGE DEBUG ===');
    console.log('Raw post ID from params:', rawPostId);
    console.log('Cleaned post ID:', postId);
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);
    console.log('Hash:', window.location.hash);
    console.log('=== END DEBUG ===');

    useEffect(() => {
        // Detect if user is on mobile
        setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId || postId === 'undefined' || postId === 'null' || postId === 'id') {
                console.error('Invalid post ID:', postId);
                setError('شناسه پست نامعتبر است');
                setLoadingPost(false);
                return;
            }

            // Additional validation for postId format
            if (postId.length < 3) {
                console.error('Post ID too short:', postId);
                setError('شناسه پست نامعتبر است');
                setLoadingPost(false);
                return;
            }

            setLoadingPost(true);
            setError(null);

            try {
                // First, check if there are any published posts
                await PostService.checkPublishedPosts();

                console.log('Fetching post with ID:', postId);
                console.log('User authenticated:', !!user);
                console.log('User ID:', user?.id);

                // Use PostService to fetch post with proper authentication handling
                const postData = await PostService.getPost(postId, user?.id);

                console.log('Post data received:', postData);

                if (!postData) {
                    console.error('Post not found or not accessible');
                    setError('پست مورد نظر یافت نشد یا در دسترس نیست');
                    setPost(null);
                    return;
                }

                setPost(postData);
            } catch (error) {
                console.error('Error fetching post:', error);
                setError('خطا در بارگذاری پست');
                setPost(null);
            } finally {
                setLoadingPost(false);
            }
        };

        fetchPost();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId, user?.id]); // Removed router from dependencies

    const generateShareUrl = (type: 'web' | 'app') => {
        const baseUrl = window.location.origin;

        if (type === 'app') {
            // For Flutter app deep linking
            return `vista://post/${postId}`;
        } else {
            // For web
            return `${baseUrl}/post/${postId}`;
        }
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
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (clipboardError) {
                console.error('Error copying to clipboard:', clipboardError);
            }
        }
        setShowShareOptions(false);
    };

    const handlePostUpdate = (updatedPost: PostWithProfile) => {
        setPost(updatedPost);
    };

    const handlePostDeleted = () => {
        router.replace('/feed');
    };

    const handleSignUp = () => {
        router.push('/auth');
    };

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">در حال بررسی احراز هویت...</p>
                </div>
            </div>
        );
    }

    // Show loading while fetching post
    if (loadingPost) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری پست...</p>
                </div>
            </div>
        );
    }

    // Show error if post not found
    if (!post && !loadingPost) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {error || 'پست مورد نظر یافت نشد'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        ممکن است این پست حذف شده یا در دسترس نیست
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                        >
                            بازگشت
                        </button>
                        <button
                            onClick={() => router.push('/feed')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            بازگشت به فید
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                <div className="flex items-center justify-between p-3 md:p-4">
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

                        {/* Share Options Dropdown */}
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
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4">
                {post && (
                    <PostCard
                        post={post}
                        onUpdate={handlePostUpdate}
                        onPostDeleted={handlePostDeleted}
                        showComments={user && profile ? true : false}
                    />
                )}
            </div>

            {/* Sign Up Banner for Non-Authenticated Users */}
            {(!user || !profile) && (
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg z-50 md:pb-4">
                    <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base md:text-lg">خودت رو به دوستانت در ویستا معرفی کن!</h3>
                                <p className="text-blue-100 text-xs md:text-sm">به جامعه ما بپیوند و محتوای بیشتری ببین</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignUp}
                            className="flex items-center gap-2 bg-white text-blue-600 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-full md:w-auto justify-center"
                        >
                            <span>ورود</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close share options */}
            {showShareOptions && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowShareOptions(false)}
                />
            )}
        </div>
    );
} 