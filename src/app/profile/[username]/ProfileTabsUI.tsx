"use client";
import { Profile, Post } from '@/lib/supabase';
import { Music, MessageSquare, Heart, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PostCard } from '@/components/ui/PostCard';
import { Button } from '@/components/ui/Button';
import GoldenTickPromo from '@/components/ui/GoldenTickPromo';
import GoldenTickBadge from '@/components/ui/GoldenTickBadge';
import SettingsDrawer from '@/components/ui/SettingsDrawer';
import GoldenTickModal from '@/components/ui/GoldenTickModal';

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
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
    const [showGoldenTickModal, setShowGoldenTickModal] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { user, signOut } = useAuth();
    const router = useRouter();

    // Check if the current user is viewing their own profile
    const isOwnProfile = user?.id === profile.id;

    // Get current verification status
    const hasGoldenTick = profile?.verification_type === 'premium';

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

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/auth');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
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
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {profile.full_name || profile.username}
                                                </h1>
                                                {hasGoldenTick && <GoldenTickBadge size="lg" />}
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 mb-3">@{profile.username}</p>
                                        </div>
                                        {isOwnProfile && (
                                            <div className="flex gap-2">
                                                {/* Settings button - visible on mobile */}
                                                <Button
                                                    onClick={() => setShowSettingsDrawer(true)}
                                                    variant="outline"
                                                    className="flex items-center gap-2 md:hidden"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                                {/* Edit Profile button - visible on desktop */}
                                                <Button
                                                    onClick={() => router.push('/settings')}
                                                    variant="outline"
                                                    className="hidden md:flex items-center gap-2"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    ویرایش مشخصات
                                                </Button>
                                            </div>
                                        )}
                                    </div>
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

                        {/* Golden Tick CTA - Show for own profile without golden tick */}
                        {isOwnProfile && !hasGoldenTick && (
                            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex-1 text-center md:text-right">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                            تیک طلایی ویستا
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            با خرید تیک طلایی، اعتبار و ویژگی‌های بیشتری کسب کنید
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowGoldenTickModal(true)}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                    >
                                        خرید تیک طلایی
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Golden Tick Promo - Show for users without golden tick (fallback) */}
                        {!hasGoldenTick && !isOwnProfile && (
                            <div className="mb-6">
                                <GoldenTickPromo />
                            </div>
                        )}

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

            {/* Settings Drawer - Mobile Only */}
            <SettingsDrawer
                isOpen={showSettingsDrawer}
                onClose={() => setShowSettingsDrawer(false)}
                onLogout={handleLogout}
            />

            {/* Golden Tick Modal */}
            <GoldenTickModal
                isOpen={showGoldenTickModal}
                onClose={() => setShowGoldenTickModal(false)}
                onPurchase={async (plan) => {
                    if (!user) return

                    setIsPurchasing(true)
                    try {
                        const planData = plan === 'monthly' 
                            ? { price: 2000, name: 'ماهانه' }
                            : { price: 899000, name: 'سالانه' }

                        // ذخیره plan در localStorage برای استفاده در callback
                        localStorage.setItem('payment_plan', plan)

                        // Create payment request
                        const response = await fetch('/api/payment/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userId: user.id,
                                plan,
                                amount: planData.price
                            }),
                        })

                        const data = await response.json()

                        if (response.ok && data.success && data.paymentUrl) {
                            // Redirect to payment URL
                            window.location.href = data.paymentUrl
                        } else {
                            alert(data.error || 'خطا در ایجاد درخواست پرداخت')
                            setIsPurchasing(false)
                        }
                    } catch (error) {
                        console.error('Error creating payment:', error)
                        alert('خطا در ایجاد درخواست پرداخت')
                        setIsPurchasing(false)
                    }
                }}
                isLoading={isPurchasing}
            />
        </>
    );
} 