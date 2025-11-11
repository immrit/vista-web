'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function PaymentCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, refreshProfile } = useAuth()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('در حال بررسی پرداخت...')

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const paymentId = searchParams.get('payment_id')
                const authority = searchParams.get('authority')
                const statusParam = searchParams.get('status')
                const plan = searchParams.get('plan') || 'yearly'

                if (!paymentId || !user) {
                    setStatus('error')
                    setMessage('اطلاعات پرداخت ناقص است')
                    return
                }

                // Call verify API
                const response = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentId,
                        authority,
                        status: statusParam,
                        userId: user.id,
                        plan
                    }),
                })

                const data = await response.json()

                if (response.ok && data.success) {
                    setStatus('success')
                    setMessage('پرداخت با موفقیت انجام شد و تیک طلایی شما فعال شد!')
                    // Refresh profile to get updated verification status
                    await refreshProfile()
                } else {
                    setStatus('error')
                    setMessage(data.error || 'خطا در تأیید پرداخت')
                }
            } catch (error) {
                console.error('Error verifying payment:', error)
                setStatus('error')
                setMessage('خطا در بررسی پرداخت. لطفاً با پشتیبانی تماس بگیرید.')
            }
        }

        verifyPayment()
    }, [searchParams, user, refreshProfile])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            در حال بررسی پرداخت...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            پرداخت موفق!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {message}
                        </p>
                        <Button
                            onClick={() => router.push('/profile')}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                            مشاهده پروفایل
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            خطا در پرداخت
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {message}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => router.push('/settings')}
                                variant="outline"
                                className="flex-1"
                            >
                                بازگشت به تنظیمات
                            </Button>
                            <Button
                                onClick={() => router.push('/profile')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                مشاهده پروفایل
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}



