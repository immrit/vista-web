'use client'

import { useState } from 'react'
import * as React from 'react'
import { X, Check, Star, Zap, Shield, Users, Sparkles, Crown } from 'lucide-react'
import { Button } from './Button'

interface GoldenTickModalProps {
    isOpen: boolean
    onClose: () => void
    onPurchase: (plan: string) => Promise<void>
    isLoading?: boolean
}

const plans = [
    {
        id: 'monthly',
        name: 'اشتراک ماهانه',
        price: 2000,
        priceFormatted: '2,000',
        originalPrice: 149000,
        originalPriceFormatted: '149,000',
        currency: 'تومان',
        period: 'ماهانه',
        features: [
            'تیک طلایی در کنار نام کاربری',
            'دسترسی به ویژگی‌های ویژه',
            'اولویت در نمایش پست‌ها',
            'پشتیبانی ویژه',
            'بدون تبلیغات',
            'ویژگی‌های پیشرفته'
        ],
        popular: false,
        discount: '33%'
    },
    {
        id: 'yearly',
        name: 'اشتراک سالانه',
        price: 899000,
        priceFormatted: '899,000',
        originalPrice: 1788000,
        originalPriceFormatted: '1,788,000',
        currency: 'تومان',
        period: 'سالانه',
        features: [
            'همه ویژگی‌های اشتراک ماهانه',
            '2 ماه رایگان',
            'دسترسی زودهنگام به ویژگی‌های جدید',
            'پشتیبانی 24/7',
            'نمایش ویژه در جستجوها',
            'دسترسی به ابزارهای حرفه‌ای'
        ],
        popular: true,
        discount: '50%'
    }
]

export default function GoldenTickModal({
    isOpen,
    onClose,
    onPurchase,
    isLoading = false
}: GoldenTickModalProps) {
    const [selectedPlan, setSelectedPlan] = useState('yearly')

    // Reset to default when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedPlan('yearly')
        }
    }, [isOpen])

    if (!isOpen) return null

    const selectedPlanData = plans.find(p => p.id === selectedPlan) || plans[1]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center text-white">
                        <div className="flex items-center justify-center mb-4">
                            <Crown className="w-8 h-8 mr-2" />
                            <h2 className="text-2xl font-bold">تیک طلایی ویستا</h2>
                        </div>
                        <p className="text-white/90 text-lg">
                            به جمع اعضای ویژه ویستا بپیوندید و تجربه‌ای متفاوت داشته باشید
                        </p>
                    </div>
                </div>

                {/* Plans */}
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${selectedPlan === plan.id
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-amber-300'
                                    }`}
                                onClick={() => !isLoading && setSelectedPlan(plan.id)}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                            محبوب‌ترین
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                        {plan.name}
                                    </h3>

                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                            {plan.priceFormatted}
                                        </span>
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            {plan.currency}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm text-zinc-500 line-through">
                                            {plan.originalPriceFormatted} {plan.currency}
                                        </span>
                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-medium">
                                            {plan.discount} تخفیف
                                        </span>
                                    </div>

                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                        {plan.period}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {selectedPlan === plan.id && (
                                    <div className="absolute top-4 right-4">
                                        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Benefits */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 text-center">
                            مزایای تیک طلایی
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">نمایش ویژه</h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">پست‌های شما در اولویت نمایش قرار می‌گیرند</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">ویژگی‌های پیشرفته</h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">دسترسی به ابزارهای حرفه‌ای و پیشرفته</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">امنیت بیشتر</h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">حفاظت بیشتر از حساب کاربری شما</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">جامعه ویژه</h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">عضویت در گروه‌های ویژه اعضا</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => onPurchase(selectedPlan)}
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    در حال پردازش...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    خرید تیک طلایی ({selectedPlanData.priceFormatted} {selectedPlanData.currency})
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={onClose}
                            disabled={isLoading}
                            variant="outline"
                            className="flex-1 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                        >
                            انصراف
                        </Button>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-4">
                        با خرید تیک طلایی، شما شرایط و قوانین ویستا را می‌پذیرید
                    </p>
                </div>
            </div>
        </div>
    )
}
