'use client'

import { useState } from 'react'
import { X, Crown, Settings, User, Bell, Shield, Palette, Globe, HelpCircle, LogOut } from 'lucide-react'
import { Button } from './Button'
import GoldenTickModal from './GoldenTickModal'

interface SettingsModalProps {
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

export default function SettingsModal({ isOpen, onClose, onLogout }: SettingsModalProps) {
    const [showGoldenTick, setShowGoldenTick] = useState(false)

    if (!isOpen) return null

    const handleItemClick = (item: any) => {
        if (item.action === 'open-golden-tick') {
            setShowGoldenTick(true)
        } else if (item.href) {
            window.location.href = item.href
        }
    }

    const handleGoldenTickPurchase = (plan: string) => {
        console.log('Purchasing Golden Tick plan:', plan)
        // TODO: Implement purchase logic
        setShowGoldenTick(false)
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
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
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                                                        <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent font-medium">
                                                            ویژه
                                                        </span>
                                                    </div>
                                                )}

                                                {item.href && (
                                                    <div className="w-4 h-4 text-zinc-400">
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
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
            </div>

            {/* Golden Tick Modal */}
            <GoldenTickModal
                isOpen={showGoldenTick}
                onClose={() => setShowGoldenTick(false)}
                onPurchase={handleGoldenTickPurchase}
            />
        </>
    )
} 