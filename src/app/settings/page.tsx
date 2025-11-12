'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerificationModal } from '@/components/ui/VerificationModal';
import GoldenTickModal from '@/components/ui/GoldenTickModal';
import { SubscriptionBadge } from '@/components/ui/SubscriptionBadge';
import { RenewalPrompt } from '@/components/ui/RenewalPrompt';
import { SubscriptionStatus } from '@/components/ui/SubscriptionStatus';
import { useSubscription } from '@/hooks/useSubscription';
import {
    Trash2,
    Save,
    Shield,
    AlertTriangle,
    Mail,
    Bell,
    Crown,
    Settings,
    Lock,
    Globe,
    User,
    ChevronRight,
    ArrowLeft,
    Eye,
    EyeOff,
    Smartphone,
    Moon,
    Sun,
    Volume2,
    VolumeX,
    Wifi,
    WifiOff,
    Check,
    X
} from 'lucide-react';

type SettingsSection = 'main' | 'profile' | 'notifications' | 'privacy' | 'appearance' | 'security' | 'golden-tick';

export default function SettingsPage() {
    const { user, profile, loading, updateProfile, sendDeleteCode, verifyDeleteCode } = useAuth();
    const router = useRouter();
    const subscription = useSubscription();

    const [currentSection, setCurrentSection] = useState<SettingsSection>('main');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showGoldenTickModal, setShowGoldenTickModal] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        full_name: profile?.full_name || '',
        username: profile?.username || '',
        bio: profile?.bio || '',
    });

    // Settings state
    const [settings, setSettings] = useState({
        notifications: {
            newPosts: true,
            comments: true,
            likes: true,
            mentions: true,
            messages: true,
            sound: true,
            vibration: true
        },
        privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showLastSeen: true,
            allowMessages: 'everyone',
            showOnlineStatus: true
        },
        appearance: {
            theme: 'system',
            language: 'fa',
            compactMode: false,
            fontSize: 'medium'
        },
        security: {
            twoFactorAuth: false,
            loginNotifications: true,
            sessionTimeout: 30,
            autoLock: false
        }
    });

    // Update form data when profile changes
    useEffect(() => {
        if (profile) {
            setProfileForm({
                full_name: profile.full_name || '',
                username: profile.username || '',
                bio: profile.bio || '',
            });
        }
    }, [profile]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-lg text-gray-500 dark:text-gray-300">
                در حال بارگذاری...
            </div>
        );
    }

    if (!user || !profile) {
        router.push('/auth');
        return null;
    }

    const handleProfileSave = async () => {
        try {
            setError(null);
            setSuccess(null);
            await updateProfile(profileForm);
            setSuccess('پروفایل با موفقیت بروزرسانی شد');
            setIsEditingProfile(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در بروزرسانی پروفایل');
        }
    };

    const handleSettingChange = (category: string, setting: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category as keyof typeof prev],
                [setting]: value
            }
        }));
    };

    const handleSaveSettings = async () => {
        try {
            setError(null);
            setSuccess(null);
            console.log('Saving settings:', settings);
            setSuccess('تنظیمات با موفقیت ذخیره شد');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات');
        }
    };

    const hasGoldenTick = profile?.verification_type === 'premium';

    const handleGoldenTickPurchase = async (plan: string) => {
        if (!user) return

        setIsPurchasing(true)
        try {
            setError(null);
            setSuccess(null);
            
                const planData = plan === 'monthly'
                    ? { price: 99000, name: 'ماهانه' }
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
                setError(data.error || 'خطا در ایجاد درخواست پرداخت')
                setIsPurchasing(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در ایجاد درخواست پرداخت');
            setIsPurchasing(false);
        }
    };

    const handleSendDeleteCode = async () => {
        try {
            setIsSendingCode(true);
            setError(null);
            const result = await sendDeleteCode();
            setShowVerificationModal(true);
            setSuccess('کد تأیید به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در ارسال کد تأیید');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerifyCode = async (code: string) => {
        try {
            setIsVerifying(true);
            setError(null);
            await verifyDeleteCode(code);
            setSuccess('حساب کاربری شما با موفقیت حذف شد');
            router.push('/auth');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'کد تأیید نامعتبر است');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        try {
            setIsSendingCode(true);
            setError(null);
            await sendDeleteCode();
            setSuccess('کد تأیید جدید ارسال شد');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در ارسال مجدد کد');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'حذف') {
            setError('لطفاً کلمه "حذف" را وارد کنید');
            return;
        }
        await handleSendDeleteCode();
    };

    const renderMainSettings = () => (
        <div className="space-y-2">
            {/* Renewal Prompt - نمایش در صورت انقضای نزدیک یا منقضی شده */}
            <RenewalPrompt />
            
            {/* اگر کاربر اشتراک دارد، کارت وضعیت اشتراک را نشان بده (به جای بخش خرید) */}
            {subscription.isActive ? (
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">تیک طلایی فعال</span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {subscription.plan === 'monthly' ? 'ماهانه' : 'سالانه'}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">زمان باقیمانده:</span>
                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                {subscription.daysRemaining} روز
                            </span>
                        </div>
                        {subscription.expiresAt && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">تاریخ انقضا:</span>
                                <span className="text-sm text-gray-900 dark:text-white">
                                    {subscription.expiresAt.toLocaleDateString('fa-IR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                        {subscription.isExpiringSoon && (
                            <Button
                                onClick={() => setShowGoldenTickModal(true)}
                                className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                تمدید اشتراک
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                /* اگر اشتراک ندارد، بخش خرید را نشان بده */
                <div
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-800/30 dark:hover:to-orange-800/30 transition-all"
                    onClick={() => setCurrentSection('golden-tick')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">تیک طلایی ویستا</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">عضویت ویژه و امکانات خاص</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
            )}

            {/* Profile Settings */}
            <div
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setCurrentSection('profile')}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">اطلاعات پروفایل</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ویرایش نام، نام کاربری و بیوگرافی</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Notifications Settings */}
            <div
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setCurrentSection('notifications')}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">اعلان‌ها</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">تنظیم اعلان‌ها و صدا</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Privacy Settings */}
            <div
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setCurrentSection('privacy')}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">حریم خصوصی</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">تنظیمات امنیت و نمایش</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Appearance Settings */}
            <div
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setCurrentSection('appearance')}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">ظاهر</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">تم، زبان و اندازه فونت</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Security Settings */}
            <div
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setCurrentSection('security')}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">امنیت</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">احراز هویت و نشست‌ها</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Account Deletion */}
            <div
                className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200">حذف حساب کاربری</h3>
                        <p className="text-sm text-red-600 dark:text-red-300">حذف دائمی حساب و اطلاعات</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
            </div>
        </div>
    );

    const renderProfileSettings = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات شخصی</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            نام کامل
                        </label>
                        <Input
                            type="text"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                            disabled={!isEditingProfile}
                            placeholder="نام کامل خود را وارد کنید"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            نام کاربری
                        </label>
                        <Input
                            type="text"
                            value={profileForm.username}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                            disabled={!isEditingProfile}
                            placeholder="نام کاربری"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            بیوگرافی
                        </label>
                        <textarea
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                            disabled={!isEditingProfile}
                            placeholder="درباره خودتان بنویسید..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white disabled:opacity-50"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ایمیل
                        </label>
                        <Input
                            type="email"
                            value={user.email || ''}
                            disabled={true}
                            className="opacity-50"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ایمیل قابل تغییر نیست
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    {!isEditingProfile ? (
                        <Button
                            onClick={() => setIsEditingProfile(true)}
                            className="flex items-center gap-2"
                        >
                            <User className="w-4 h-4" />
                            ویرایش پروفایل
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleProfileSave}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Save className="w-4 h-4" />
                                ذخیره تغییرات
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsEditingProfile(false);
                                    setProfileForm({
                                        full_name: profile.full_name || '',
                                        username: profile.username || '',
                                        bio: profile.bio || '',
                                    });
                                }}
                                variant="outline"
                            >
                                انصراف
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const renderNotificationsSettings = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اعلان‌های محتوا</h3>

                <div className="space-y-4">
                    {Object.entries(settings.notifications).filter(([key]) => !['sound', 'vibration'].includes(key)).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {key === 'newPosts' && 'پست‌های جدید'}
                                    {key === 'comments' && 'نظرات'}
                                    {key === 'likes' && 'لایک‌ها'}
                                    {key === 'mentions' && 'منشن‌ها'}
                                    {key === 'messages' && 'پیام‌ها'}
                                </label>
                            </div>
                            <button
                                onClick={() => handleSettingChange('notifications', key, !value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">صدا و لرزش</h3>

                <div className="space-y-4">
                    {Object.entries(settings.notifications).filter(([key]) => ['sound', 'vibration'].includes(key)).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {key === 'sound' ? (
                                    <Volume2 className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <Smartphone className="w-5 h-5 text-gray-500" />
                                )}
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {key === 'sound' && 'صدای اعلان'}
                                    {key === 'vibration' && 'لرزش'}
                                </label>
                            </div>
                            <button
                                onClick={() => handleSettingChange('notifications', key, !value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderPrivacySettings = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">نمایش پروفایل</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            نمایش پروفایل
                        </label>
                        <select
                            value={settings.privacy.profileVisibility}
                            onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                        >
                            <option value="public">عمومی</option>
                            <option value="followers">فقط دنبال‌کنندگان</option>
                            <option value="private">خصوصی</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-gray-500" />
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                نمایش آخرین بازدید
                            </label>
                        </div>
                        <button
                            onClick={() => handleSettingChange('privacy', 'showLastSeen', !settings.privacy.showLastSeen)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.privacy.showLastSeen ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.privacy.showLastSeen ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-gray-500" />
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                نمایش وضعیت آنلاین
                            </label>
                        </div>
                        <button
                            onClick={() => handleSettingChange('privacy', 'showOnlineStatus', !settings.privacy.showOnlineStatus)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.privacy.showOnlineStatus ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">پیام‌ها</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        دریافت پیام از
                    </label>
                    <select
                        value={settings.privacy.allowMessages}
                        onChange={(e) => handleSettingChange('privacy', 'allowMessages', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                    >
                        <option value="everyone">همه</option>
                        <option value="followers">فقط دنبال‌کنندگان</option>
                        <option value="none">هیچ‌کس</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderAppearanceSettings = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ظاهر</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            تم
                        </label>
                        <select
                            value={settings.appearance.theme}
                            onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                        >
                            <option value="light">روشن</option>
                            <option value="dark">تیره</option>
                            <option value="system">سیستم</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            زبان
                        </label>
                        <select
                            value={settings.appearance.language}
                            onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                        >
                            <option value="fa">فارسی</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            اندازه فونت
                        </label>
                        <select
                            value={settings.appearance.fontSize}
                            onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                        >
                            <option value="small">کوچک</option>
                            <option value="medium">متوسط</option>
                            <option value="large">بزرگ</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                حالت فشرده
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                نمایش محتوا در فضای کمتر
                            </p>
                        </div>
                        <button
                            onClick={() => handleSettingChange('appearance', 'compactMode', !settings.appearance.compactMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.appearance.compactMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.appearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">امنیت</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-500" />
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    احراز هویت دو مرحله‌ای
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    افزایش امنیت حساب کاربری
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSettingChange('security', 'twoFactorAuth', !settings.security.twoFactorAuth)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.security.twoFactorAuth ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-500" />
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    اعلان ورود
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    اعلان ورود از دستگاه‌های جدید
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSettingChange('security', 'loginNotifications', !settings.security.loginNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.security.loginNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.security.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            مدت زمان نشست (دقیقه)
                        </label>
                        <select
                            value={settings.security.sessionTimeout}
                            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                        >
                            <option value={15}>15 دقیقه</option>
                            <option value={30}>30 دقیقه</option>
                            <option value={60}>1 ساعت</option>
                            <option value={120}>2 ساعت</option>
                            <option value={0}>نامحدود</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGoldenTickSettings = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تیک طلایی ویستا</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        به جمع اعضای ویژه ویستا بپیوندید و تجربه‌ای متفاوت داشته باشید
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-white dark:bg-zinc-800 rounded-lg">
                        <Crown className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">تیک طلایی</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">نمایش ویژه در کنار نام</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-zinc-800 rounded-lg">
                        <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">امکانات ویژه</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">دسترسی به ویژگی‌های خاص</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-zinc-800 rounded-lg">
                        <Globe className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">بدون تبلیغات</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">تجربه بدون مزاحمت</p>
                    </div>
                </div>

                {subscription.isActive ? (
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-500" />
                                <span className="font-semibold text-gray-900 dark:text-white">تیک طلایی فعال</span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {subscription.plan === 'monthly' ? 'ماهانه' : 'سالانه'}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">زمان باقیمانده:</span>
                                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                    {subscription.daysRemaining} روز
                                </span>
                            </div>
                            {subscription.expiresAt && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">تاریخ انقضا:</span>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {subscription.expiresAt.toLocaleDateString('fa-IR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            )}
                            {subscription.isExpiringSoon && (
                                <Button
                                    onClick={() => setShowGoldenTickModal(true)}
                                    className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                                >
                                    <Crown className="w-4 h-4 mr-2" />
                                    تمدید اشتراک
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={() => setShowGoldenTickModal(true)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                    >
                        <Crown className="w-4 h-4 mr-2" />
                        خرید تیک طلایی
                    </Button>
                )}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (currentSection) {
            case 'profile':
                return renderProfileSettings();
            case 'notifications':
                return renderNotificationsSettings();
            case 'privacy':
                return renderPrivacySettings();
            case 'appearance':
                return renderAppearanceSettings();
            case 'security':
                return renderSecuritySettings();
            case 'golden-tick':
                return renderGoldenTickSettings();
            default:
                return renderMainSettings();
        }
    };

    const getSectionTitle = () => {
        switch (currentSection) {
            case 'profile':
                return 'اطلاعات پروفایل';
            case 'notifications':
                return 'اعلان‌ها';
            case 'privacy':
                return 'حریم خصوصی';
            case 'appearance':
                return 'ظاهر';
            case 'security':
                return 'امنیت';
            case 'golden-tick':
                return 'تیک طلایی ویستا';
            default:
                return 'تنظیمات';
        }
    };

    return (
        <>
            <div className="min-h-screen dark:bg-zinc-950 bg-gray-50">
                <main className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-8 py-8 pb-20 md:pb-8 pt-16 md:pt-8">
                    <div className="w-full max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            {currentSection !== 'main' && (
                                <button
                                    onClick={() => setCurrentSection('main')}
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    بازگشت
                                </button>
                            )}
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {getSectionTitle()}
                            </h1>
                            {currentSection === 'main' && (
                                <p className="text-gray-600 dark:text-gray-400">
                                    تنظیمات حساب کاربری و حریم خصوصی خود را مدیریت کنید
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
                                {success}
                            </div>
                        )}

                        {/* Content */}
                        {renderContent()}

                        {/* Save Settings Button - Only show in sub-sections */}
                        {currentSection !== 'main' && currentSection !== 'golden-tick' && (
                            <div className="mt-6">
                                <Button
                                    onClick={handleSaveSettings}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    ذخیره تنظیمات
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Delete Account Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">حذف حساب کاربری</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">این عمل غیرقابل بازگشت است</p>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-red-700 dark:text-red-300">
                                با حذف حساب کاربری، تمام اطلاعات شما شامل پست‌ها، نظرات، لایک‌ها و فایل‌ها برای همیشه حذف خواهد شد.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    برای تأیید، کلمه &quot;حذف&quot; را وارد کنید
                                </label>
                                <Input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="حذف"
                                    className="border-red-300 focus:border-red-500 focus:ring-red-500"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'حذف' || isSendingCode}
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    {isSendingCode ? 'در حال ارسال...' : 'ارسال کد تأیید'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    variant="outline"
                                >
                                    انصراف
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => {
                    setShowVerificationModal(false);
                    setError(null);
                    setSuccess(null);
                }}
                onVerify={handleVerifyCode}
                email={user.email || ''}
                isVerifying={isVerifying}
                error={error}
                success={success}
                onResend={handleResendCode}
                isResending={isSendingCode}
            />

            {/* Golden Tick Modal */}
            <GoldenTickModal
                isOpen={showGoldenTickModal}
                onClose={() => setShowGoldenTickModal(false)}
                onPurchase={handleGoldenTickPurchase}
                isLoading={isPurchasing}
            />
        </>
    );
} 