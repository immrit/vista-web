'use client'

import { useMemo } from 'react'
import { useAuth } from './useAuth'

interface SubscriptionStatus {
  isActive: boolean
  isExpired: boolean
  isExpiringSoon: boolean
  daysRemaining: number | null
  plan: 'monthly' | 'yearly' | null
  expiresAt: Date | null
}

export function useSubscription(): SubscriptionStatus {
  const { profile } = useAuth()

  const status = useMemo(() => {
    if (!profile?.subscription_expires_at || profile.verification_type !== 'goldTick') {
      return {
        isActive: false,
        isExpired: false,
        isExpiringSoon: false,
        daysRemaining: null,
        plan: null,
        expiresAt: null,
      }
    }

    const expiresAt = new Date(profile.subscription_expires_at)
    const now = new Date()
    const msRemaining = expiresAt.getTime() - now.getTime()
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

    return {
      isActive: daysRemaining > 0,
      isExpired: daysRemaining <= 0,
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      plan: profile.subscription_plan as 'monthly' | 'yearly' | null,
      expiresAt,
    }
  }, [profile])

  return status
}

