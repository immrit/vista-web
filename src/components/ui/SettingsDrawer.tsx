'use client'

import { useState } from 'react'
import { X, Crown, Settings, User, Bell, Shield, Palette, Globe, HelpCircle, LogOut, ChevronLeft } from 'lucide-react'
import { Button } from './Button'
import GoldenTickModal from './GoldenTickModal'
import { useAuth } from '@/hooks/useAuth'

interface SettingsDrawerProps {
    isOpen: boolean
    onClose: () => void
    onLogout: () => void
}

const settingsSections = [
    {
        id: 'account',
        title: 'حساب کاربری',
        icon: User,
        items: [
            { id: 'profile', label: 'ویرایش پروفایل', href: '/profile/edit' },
            { id: 'privacy', label: 'حریم خصوصی', href: '/settings/privacy' },
            { id: 'security', label: 'امنیت', href: '/settings/security' }
        ]
    },
    {
        id: 'preferences',
        title: 'تنظیمات',
        icon: Settings,
        items: [
            { id: 'notifications', label: 'اعلان‌ها', href: '/settings/notifications' },
            { id: 'appearance', label: 'ظاهر', href: '/settings/appearance' },
            { id: 'language', label: 'زبان', href: '/settings/language' }
        ]
    },
    {
        id: 'premium',
        title: 'ویژگی‌های ویژه',
        icon: Crown,
        items: [
            { id: 'golden-tick', label: 'تیک طلایی', action: 'open-golden-tick' },
            { id: 'premium-features', label: 'ویژگی‌های حرفه‌ای', href: '/premium' }
        ]
    },
    {
        id: 'support',
        title: 'پشتیبانی',
        icon: HelpCircle,
        items: [
            { id: 'help', label: 'راهنما', href: '/help' },
            { id: 'contact', label: 'تماس با ما', href: '/contact' },
            { id: 'about', label: 'درباره ویستا', href: '/about' }
        ]
    }
]

export default function SettingsDrawer({ isOpen, onClose, onLogout }: SettingsDrawerProps) {
    const [showGoldenTickModal, setShowGoldenTickModal] = useState(false)
    const [isPurchasing, setIsPurchasing] = useState(false)
    const { user, profile } = useAuth()

    if (!isOpen) return null

    const hasGoldenTick = profile?.verification_type === 'premium'

    const handleItemClick = (item: any) => {
        if (item.action === 'open-golden-tick') {
            setShowGoldenTickModal(true)
        } else if (item.href) {
            window.location.href = item.href
        }
    }

    const handlePurchase = async (plan: string) => {
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
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-blue-500 to-purple-600">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center text-white">
                        <div className="flex items-center justify-center mb-2">
                            <Settings className="w-6 h-6 mr-2" />
                            <h2 className="text-xl font-bold">تنظیمات</h2>
                        </div>
                        <p className="text-white/90 text-sm">
                            مدیریت حساب کاربری و تنظیمات شخصی
                        </p>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                        {settingsSections.map((section) => (
                            <div key={section.id} className="space-y-3">
                                <div className="flex items-center gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                                    <section.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                                        {section.title}
                                    </h3>
                                </div>

                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleItemClick(item)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-right"
                                        >
                                            <span className="text-zinc-700 dark:text-zinc-300">
                                                {item.label}
                                            </span>

                                            {item.id === 'golden-tick' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                                                        <Crown className="w-3 h-3 text-white" />
                                                    </div>
                                                    {hasGoldenTick && (
                                                        <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent font-medium">
                                                            فعال
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {item.href && (
                                                <div className="w-4 h-4 text-zinc-400">
                                                    <ChevronLeft className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Logout Button */}
                    <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                        <Button
                            onClick={onLogout}
                            variant="outline"
                            className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            خروج از حساب کاربری
                        </Button>
                    </div>
                </div>
            </div>

            {/* Golden Tick Modal */}
            <GoldenTickModal
                isOpen={showGoldenTickModal}
                onClose={() => setShowGoldenTickModal(false)}
                onPurchase={handlePurchase}
                isLoading={isPurchasing}
            />
        </>
    )
} 