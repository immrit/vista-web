'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Check, X, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type PaymentStatus = 'loading' | 'success' | 'error' | 'cancelled'

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshProfile, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [message, setMessage] = useState('در حال بررسی پرداخت...')
  const [paymentDetails, setPaymentDetails] = useState<{
    refNumber?: string
    amount?: number
    paidAt?: string
    subscription?: {
      plan: string
      startedAt: string
      expiresAt: string
    }
  }>({})

  useEffect(() => {
    // 🔥 صبر کن تا auth لود بشه
    if (authLoading) {
      console.log('⏳ Waiting for auth...')
      return
    }

    const verifyPayment = async () => {
      try {
        const success = searchParams.get('success')
        const trackId = searchParams.get('trackId')
        const orderId = searchParams.get('orderId')

        console.log('📥 Zibal callback:', { success, trackId, orderId, user: !!user })

        if (!user) {
          setStatus('error')
          setMessage('لطفاً ابتدا وارد حساب کاربری خود شوید')
          setTimeout(() => router.push('/auth'), 2000)
          return
        }

        if (!trackId) {
          setStatus('error')
          setMessage('اطلاعات پرداخت ناقص است')
          return
        }

        // ⚠️ فقط success=0 یعنی کاربر کنسل کرده
        // status=2 قابل اعتماد نیست! (باگ زیبال)
        if (success === '0') {
          setStatus('cancelled')
          setMessage('شما پرداخت را لغو کردید')
          return
        }

        // 🔥 برای همه حالات دیگه، به API verify بفرست
        // اونجا با زیبال چک میکنه واقعاً موفق بوده یا نه
        const plan = localStorage.getItem('payment_plan') || 'yearly'

        console.log('🔄 Verifying payment with API...')

        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: Number(trackId),
            userId: user.id,
            plan,
          }),
        })

        const data = await response.json()

        console.log('📤 Verify API response:', data)

        if (response.ok && data.success) {
          // ✅ API گفت موفق بوده
          setStatus('success')
          setMessage('پرداخت با موفقیت انجام شد و تیک طلایی شما فعال شد! 🎉')
          setPaymentDetails({
            refNumber: data.payment?.refNumber,
            amount: data.payment?.amount,
            paidAt: data.payment?.paidAt,
            subscription: data.subscription,
          })

          localStorage.removeItem('payment_plan')
          
          // 🔥 رفرش profile
          console.log('🔄 Refreshing profile...')
          await refreshProfile()

          setTimeout(() => {
            router.push('/profile')
          }, 3000)
        } else {
          // ❌ API گفت ناموفق بوده
          setStatus('error')
          setMessage(data.error || 'خطا در تأیید پرداخت. لطفاً با پشتیبانی تماس بگیرید')
        }
      } catch (error) {
        console.error('❌ Error:', error)
        setStatus('error')
        setMessage('خطا در بررسی پرداخت')
      }
    }

    verifyPayment()
  }, [searchParams, user, refreshProfile, router, authLoading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 text-center">
        {/* Loading */}
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              در حال بررسی پرداخت...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              پرداخت موفق! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>

            {paymentDetails.subscription && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="text-sm text-amber-900 dark:text-amber-100 space-y-1 text-right">
                  <p>
                    📅 پلن:{' '}
                    <strong>
                      {paymentDetails.subscription.plan === 'monthly' ? 'ماهانه (۳۰ روز)' : 'سالانه (۳۶۵ روز)'}
                    </strong>
                  </p>
                  <p>
                    ⏰ تاریخ انقضا:{' '}
                    <strong>
                      {new Date(paymentDetails.subscription.expiresAt).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {paymentDetails.refNumber && (
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 mb-6 text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  شماره پیگیری: <span className="font-mono">{paymentDetails.refNumber}</span>
                </p>
                {paymentDetails.amount && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    مبلغ: {paymentDetails.amount.toLocaleString('fa-IR')} تومان
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={() => router.push('/profile')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              مشاهده پروفایل
            </Button>
          </>
        )}

        {/* Cancelled */}
        {status === 'cancelled' && (
          <>
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              پرداخت لغو شد
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/settings')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                تلاش مجدد
              </Button>
              <Button
                onClick={() => router.push('/profile')}
                variant="outline"
                className="flex-1"
              >
                بازگشت
              </Button>
            </div>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              خطا در پرداخت
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/settings')}
                variant="outline"
                className="flex-1"
              >
                بازگشت
              </Button>
              <Button
                onClick={() => router.push('/profile')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                پروفایل
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
