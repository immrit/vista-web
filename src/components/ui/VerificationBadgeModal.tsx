'use client'

import { useState } from 'react'
import * as React from 'react'
import { X, Check, Star, Zap, Shield, Users, Sparkles, BadgeCheck, Crown } from 'lucide-react'
import { Button } from './Button'

export type VerificationType = 'black' | 'gold' | null

interface VerificationBadgeModalProps {
    isOpen: boolean
    onClose: () => void
    onPurchase: (type: VerificationType, plan: string) => void
    currentVerificationType?: VerificationType
}

const blackTickPlans = [
    {
        id: 'black-monthly',
        name: 'تیک مشکی - ماهانه',
        price: '49,000',
        originalPrice: '79,000',
        currency: 'تومان',
        period: 'ماهانه',
        features: [
            'تیک مشکی تأیید هویت در کنار نام کاربری',
            'نمایش تأیید هویت در پروفایل',
            'افزایش اعتبار حساب کاربری',
            'پشتیبانی اولویت‌دار',
            'حفاظت از حساب کاربری'
        ],
        popular: false,
        discount: '38%'
    },
    {
        id: 'black-yearly',
        name: 'تیک مشکی - سالانه',
        price: '449,000',
        originalPrice: '948,000',
        currency: 'تومان',
        period: 'سالانه',
        features: [
            'همه ویژگی‌های اشتراک ماهانه',
            '2 ماه رایگان',
            'اولویت در تأیید هویت',
            'پشتیبانی 24/7',
            'نمایش ویژه در جستجوها'
        ],
        popular: true,
        discount: '53%'
    }
]

const goldTickPlans = [
    {
        id: 'gold-monthly',
        name: 'تیک طلایی - ماهانه',
        price: '99,000',
        originalPrice: '149,000',
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
        id: 'gold-yearly',
        name: 'تیک طلایی - سالانه',
        price: '899,000',
        originalPrice: '1,788,000',
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

export default function VerificationBadgeModal({ 
    isOpen, 
    onClose, 
    onPurchase,
    currentVerificationType = null 
}: VerificationBadgeModalProps) {
    // If user already has black tick, default to gold. Otherwise default to black
    const defaultType: VerificationType = currentVerificationType === 'black' ? 'gold' : 'black'
    const [selectedType, setSelectedType] = useState<VerificationType>(defaultType)
    const [selectedPlan, setSelectedPlan] = useState('yearly')

    // Reset to default when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedType(defaultType)
            setSelectedPlan('yearly')
        }
    }, [isOpen, defaultType])

    if (!isOpen) return null

    const plans = selectedType === 'black' ? blackTickPlans : goldTickPlans
    const isBlackTick = selectedType === 'black'
    const hasVerification = currentVerificationType !== null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden my-8">
                {/* Header */}
                <div className={`relative p-6 ${isBlackTick 
                    ? 'bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-900' 
                    : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500'
                }`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center text-white">
                        <div className="flex items-center justify-center mb-4">
                            {isBlackTick ? (
                                <BadgeCheck className="w-8 h-8 mr-2" />
                            ) : (
                                <Crown className="w-8 h-8 mr-2" />
                            )}
                            <h2 className="text-2xl font-bold">
                                {isBlackTick ? 'تیک مشکی تأیید هویت' : 'تیک طلایی ویستا'}
                            </h2>
                        </div>
                        <p className="text-white/90 text-lg">
                            {isBlackTick 
                                ? 'حساب کاربری خود را تأیید کنید و اعتبار بیشتری کسب کنید'
                                : 'به جمع اعضای ویژه ویستا بپیوندید و تجربه‌ای متفاوت داشته باشید'
                            }
                        </p>
                    </div>
                </div>

                {/* Type Selector */}
                {!hasVerification && (
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex gap-4 max-w-md mx-auto">
                            <button
                                onClick={() => setSelectedType('black')}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    selectedType === 'black'
                                        ? 'border-zinc-700 bg-zinc-100 dark:bg-zinc-800'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <BadgeCheck className={`w-6 h-6 ${selectedType === 'black' ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}`} />
                                    <span className={`font-semibold ${selectedType === 'black' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                        تیک مشکی
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    تأیید هویت
                                </p>
                            </button>

                            <button
                                onClick={() => setSelectedType('gold')}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    selectedType === 'gold'
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-amber-300'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Crown className={`w-6 h-6 ${selectedType === 'gold' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`} />
                                    <span className={`font-semibold ${selectedType === 'gold' ? 'text-amber-900 dark:text-amber-200' : 'text-zinc-500'}`}>
                                        تیک طلایی
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    ویژه و حرفه‌ای
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Plans */}
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                                    selectedPlan === plan.id
                                        ? isBlackTick
                                            ? 'border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                                            : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                                }`}
                                onClick={() => setSelectedPlan(plan.id)}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                                            isBlackTick
                                                ? 'bg-zinc-700 text-white'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                        }`}>
                                            محبوب‌ترین
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                        {plan.name}
                                    </h3>

                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className={`text-3xl font-bold ${
                                            isBlackTick
                                                ? 'text-zinc-700 dark:text-zinc-300'
                                                : 'text-amber-600 dark:text-amber-400'
                                        }`}>
                                            {plan.price}
                                        </span>
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            {plan.currency}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm text-zinc-500 line-through">
                                            {plan.originalPrice} {plan.currency}
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
                                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                                isBlackTick
                                                    ? 'bg-zinc-200 dark:bg-zinc-700'
                                                    : 'bg-amber-100 dark:bg-amber-900/30'
                                            }`}>
                                                <Check className={`w-3 h-3 ${
                                                    isBlackTick
                                                        ? 'text-zinc-700 dark:text-zinc-300'
                                                        : 'text-amber-600 dark:text-amber-400'
                                                }`} />
                                            </div>
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {selectedPlan === plan.id && (
                                    <div className="absolute top-4 right-4">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            isBlackTick
                                                ? 'bg-zinc-700'
                                                : 'bg-amber-500'
                                        }`}>
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Benefits */}
                    <div className={`rounded-xl p-6 mb-6 ${
                        isBlackTick
                            ? 'bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-900/50'
                            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
                    }`}>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 text-center">
                            مزایای {isBlackTick ? 'تیک مشکی' : 'تیک طلایی'}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isBlackTick
                                        ? 'bg-zinc-200 dark:bg-zinc-700'
                                        : 'bg-amber-100 dark:bg-amber-900/30'
                                }`}>
                                    <Star className={`w-5 h-5 ${
                                        isBlackTick
                                            ? 'text-zinc-700 dark:text-zinc-300'
                                            : 'text-amber-600 dark:text-amber-400'
                                    }`} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">
                                        {isBlackTick ? 'اعتبار بیشتر' : 'نمایش ویژه'}
                                    </h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {isBlackTick 
                                            ? 'حساب کاربری شما تأیید شده و قابل اعتماد است'
                                            : 'پست‌های شما در اولویت نمایش قرار می‌گیرند'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isBlackTick
                                        ? 'bg-zinc-200 dark:bg-zinc-700'
                                        : 'bg-amber-100 dark:bg-amber-900/30'
                                }`}>
                                    <Zap className={`w-5 h-5 ${
                                        isBlackTick
                                            ? 'text-zinc-700 dark:text-zinc-300'
                                            : 'text-amber-600 dark:text-amber-400'
                                    }`} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">
                                        {isBlackTick ? 'امنیت بالا' : 'ویژگی‌های پیشرفته'}
                                    </h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {isBlackTick
                                            ? 'حفاظت بیشتر از حساب کاربری شما'
                                            : 'دسترسی به ابزارهای حرفه‌ای و پیشرفته'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isBlackTick
                                        ? 'bg-zinc-200 dark:bg-zinc-700'
                                        : 'bg-amber-100 dark:bg-amber-900/30'
                                }`}>
                                    <Shield className={`w-5 h-5 ${
                                        isBlackTick
                                            ? 'text-zinc-700 dark:text-zinc-300'
                                            : 'text-amber-600 dark:text-amber-400'
                                    }`} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">
                                        {isBlackTick ? 'تأیید هویت' : 'امنیت بیشتر'}
                                    </h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {isBlackTick
                                            ? 'نمایش تأیید هویت در پروفایل'
                                            : 'حفاظت بیشتر از حساب کاربری شما'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isBlackTick
                                        ? 'bg-zinc-200 dark:bg-zinc-700'
                                        : 'bg-amber-100 dark:bg-amber-900/30'
                                }`}>
                                    <Users className={`w-5 h-5 ${
                                        isBlackTick
                                            ? 'text-zinc-700 dark:text-zinc-300'
                                            : 'text-amber-600 dark:text-amber-400'
                                    }`} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-zinc-900 dark:text-white">
                                        {isBlackTick ? 'پشتیبانی اولویت‌دار' : 'جامعه ویژه'}
                                    </h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {isBlackTick
                                            ? 'دسترسی سریع‌تر به پشتیبانی'
                                            : 'عضویت در گروه‌های ویژه اعضا'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => onPurchase(selectedType, selectedPlan)}
                            className={`flex-1 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                                isBlackTick
                                    ? 'bg-gradient-to-r from-zinc-700 to-zinc-900 hover:from-zinc-800 hover:to-zinc-950'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                            }`}
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            خرید {isBlackTick ? 'تیک مشکی' : 'تیک طلایی'}
                        </Button>

                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            انصراف
                        </Button>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-4">
                        با خرید {isBlackTick ? 'تیک مشکی' : 'تیک طلایی'}، شما شرایط و قوانین ویستا را می‌پذیرید
                    </p>
                </div>
            </div>
        </div>
    )
}

