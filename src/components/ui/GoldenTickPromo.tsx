'use client'

import { useState } from 'react'
import { Crown, Sparkles, Star, Zap, Shield } from 'lucide-react'
import { Button } from './Button'
import GoldenTickModal from './GoldenTickModal'
import { useAuth } from '@/hooks/useAuth'

interface GoldenTickPromoProps {
    className?: string
}

export default function GoldenTickPromo({ className = '' }: GoldenTickPromoProps) {
    const { profile } = useAuth()
    const [showModal, setShowModal] = useState(false)

    // 🔥 اگه پرمیوم هست، نشون نده
    if (profile?.verification_type === 'goldTick') {
        return null
    }

    const handlePurchase = async (plan: string) => {
        if (!profile) return

        try {
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
                    userId: profile.id,
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
            }
        } catch (error) {
            console.error('Error creating payment:', error)
            alert('خطا در ایجاد درخواست پرداخت')
        }
    }

    return (
        <>
            <div className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Crown className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-zinc-900 dark:text-white text-lg">
                                تیک طلایی ویستا
                            </h3>
                            <div className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                                <span className="text-white text-xs font-medium">ویژه</span>
                            </div>
                        </div>

                        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">
                            به جمع اعضای ویژه ویستا بپیوندید و از مزایای منحصر به فرد بهره‌مند شوید
                        </p>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">نمایش ویژه</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">ویژگی‌های پیشرفته</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">امنیت بیشتر</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">بدون تبلیغات</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowModal(true)}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                            <Crown className="w-4 h-4 mr-2" />
                            خرید تیک طلایی
                        </Button>
                    </div>
                </div>
            </div>

            <GoldenTickModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onPurchase={handlePurchase}
            />
        </>
    )
} 