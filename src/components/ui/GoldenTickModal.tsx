'use client'

import { Crown, Check, X } from 'lucide-react'
import { Button } from './Button'

interface GoldenTickModalProps {
    isOpen: boolean
    onClose: () => void
    onPurchase: (plan: 'monthly' | 'yearly') => void
    isLoading?: boolean
}

export default function GoldenTickModal({
    isOpen,
    onClose,
    onPurchase,
    isLoading = false
}: GoldenTickModalProps) {
    if (!isOpen) return null

    const plans = [
        {
            id: 'monthly',
            name: 'ماهانه',
            price: '۹۹,۰۰۰',
            period: 'ماه',
            features: [
                'تیک طلایی در کنار نام',
                'بدون تبلیغات',
                'دسترسی به امکانات ویژه',
                'پشتیبانی سریع‌تر'
            ],
            popular: false
        },
        {
            id: 'yearly',
            name: 'سالانه',
            price: '۸۹۹,۰۰۰',
            period: 'سال',
            originalPrice: '۱,۱۸۸,۰۰۰',
            discount: '۲۴٪ تخفیف',
            features: [
                'تمام مزایای پلن ماهانه',
                'صرفه‌جویی ۲۸۹,۰۰۰ تومان',
                'قفل قیمت برای یک سال',
                'هدیه ویژه عضویت سالانه'
            ],
            popular: true
        }
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 sm:p-6 border-b border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                    تیک طلایی ویستا
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    انتخاب پلن مناسب
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="p-4 sm:p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-xl border-2 p-4 sm:p-6 transition-all ${
                                    plan.popular
                                        ? 'border-amber-500 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg'
                                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50'
                                }`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 rounded-full shadow-lg">
                                            محبوب‌ترین
                                        </div>
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="text-center mb-4 sm:mb-6 mt-2">
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2">
                                        {plan.originalPrice && (
                                            <span className="text-sm text-gray-500 line-through">
                                                {plan.originalPrice}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline justify-center gap-1 mb-2">
                                        <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                                            {plan.price}
                                        </span>
                                        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                            تومان / {plan.period}
                                        </span>
                                    </div>
                                    {plan.discount && (
                                        <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full">
                                            {plan.discount}
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <div className="space-y-3 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Purchase Button */}
                                <Button
                                    onClick={() => onPurchase(plan.id as 'monthly' | 'yearly')}
                                    disabled={isLoading}
                                    className={`w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold ${
                                        plan.popular
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                                            : 'bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-900 dark:text-white'
                                    }`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            در حال پردازش...
                                        </span>
                                    ) : (
                                        <>
                                            <Crown className="w-4 h-4 sm:w-5 sm:h-5 inline-block ml-2" />
                                            خرید پلن {plan.name}
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Footer Note */}
                    <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 text-center">
                            💡 پس از خرید، تیک طلایی به صورت خودکار فعال می‌شود
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
