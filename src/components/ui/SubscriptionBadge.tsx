'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { Clock, AlertTriangle } from 'lucide-react'

export function SubscriptionBadge() {
  const subscription = useSubscription()

  if (!subscription.isActive) {
    return null
  }

  return (
    <div
      className={`
        px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2
        ${
          subscription.isExpiringSoon
            ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
            : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
        }
      `}
    >
      {subscription.isExpiringSoon ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <div>
        <div className="font-semibold">
          {subscription.isExpiringSoon && '⚠️ '}
          تیک طلایی فعال - {subscription.daysRemaining} روز باقیمانده
        </div>
        {subscription.expiresAt && (
          <div className="text-xs opacity-75 mt-0.5">
            انقضا:{' '}
            {subscription.expiresAt.toLocaleDateString('fa-IR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}
      </div>
    </div>
  )
}

