'use client'

import { useAuth } from '@/hooks/useAuth'
import { Crown, Calendar, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function SubscriptionStatus() {
  const { profile } = useAuth()
  const router = useRouter()

  if (!profile?.subscription_expires_at || profile.verification_type !== 'goldTick') {
    return null
  }

  const expiresAt = new Date(profile.subscription_expires_at)
  const now = new Date()
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysLeft <= 7
  const isExpired = daysLeft <= 0

  return (
    <div className={`rounded-2xl p-6 border ${
      isExpired
        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        : isExpiringSoon 
        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
        : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isExpired
            ? 'bg-red-100 dark:bg-red-900/30'
            : isExpiringSoon
            ? 'bg-orange-100 dark:bg-orange-900/30'
            : 'bg-gradient-to-br from-amber-400 to-orange-500'
        }`}>
          {isExpired || isExpiringSoon ? (
            <AlertTriangle className={`w-6 h-6 ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
          ) : (
            <Crown className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {isExpired ? 'اشتراک تیک طلایی منقضی شده' : 'اشتراک تیک طلایی فعال'}
          </h3>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {daysLeft > 0 ? (
                <>
                  <strong className={isExpiringSoon ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'}>
                    {daysLeft}
                  </strong> روز باقیمانده
                </>
              ) : (
                <strong className="text-red-600 dark:text-red-400">منقضی شده</strong>
              )}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            تاریخ انقضا: {expiresAt.toLocaleDateString('fa-IR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          {(isExpiringSoon || isExpired) && (
            <Button
              onClick={() => router.push('/settings')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              تمدید اشتراک
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}




