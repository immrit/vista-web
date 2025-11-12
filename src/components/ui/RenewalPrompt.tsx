'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function RenewalPrompt() {
  const subscription = useSubscription()
  const router = useRouter()

  // فقط برای اشتراک‌های در حال انقضا نمایش بده
  if (!subscription.isExpiringSoon && !subscription.isExpired) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">
            {subscription.isExpired 
              ? '❌ اشتراک شما به پایان رسیده است'
              : '⚠️ اشتراک شما در حال اتمام است'
            }
          </h3>
          <p className="text-sm text-white/90 mb-4">
            {subscription.isExpired
              ? 'برای ادامه استفاده از امکانات ویژه، اشتراک خود را تمدید کنید.'
              : `فقط ${subscription.daysRemaining} روز تا پایان اشتراک شما باقیمانده است.`
            }
          </p>
          <Button
            onClick={() => router.push('/settings')}
            className="bg-white text-orange-600 hover:bg-gray-100 font-semibold"
          >
            تمدید اشتراک
          </Button>
        </div>
      </div>
    </div>
  )
}

