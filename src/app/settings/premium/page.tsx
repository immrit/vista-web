'use client'

import { Crown, Check, Loader2 } from 'lucide-react'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const plans = [
  { id: 'monthly', label: 'ماهانه', price: '۱۰۰,۰۰۰', period: 'تومان / ماه' },
  { id: 'quarterly', label: '۳ ماهه', price: '۲۸۰,۰۰۰', period: 'تومان', recommended: true },
  { id: 'yearly', label: 'سالانه', price: '۱,۰۰۰,۰۰۰', period: 'تومان / سال' },
]

const features = [
  'نشان طلایی Vista',
  'استوری ۴۸ ساعته',
  'ویرایش پست',
  'حداکثر ۴۰۰ کاراکتر',
  'اولویت پشتیبانی',
  'بدون تبلیغات',
]

export default function PremiumPage() {
  const subscription = useSubscription()
  const router = useRouter()
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const handlePurchase = async (planId: string) => {
    setPurchasing(planId)
    try {
      router.push(`/payment/callback?plan=${planId}`)
    } catch {
      toast.error('خطا در شروع پرداخت')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <SettingsPageShell title="Vista Premium">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-vista-gradient flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold">Vista Premium</h2>
        <p className="text-sm text-vista-text-secondary mt-1">امکانات ویژه برای خالقان محتوا</p>
      </div>

      {subscription.isActive && (
        <div className="mb-6 p-4 rounded-2xl bg-vista-primary/10 border border-vista-primary/30">
          <p className="font-semibold text-vista-primary">اشتراک فعال</p>
          {subscription.daysRemaining != null && (
            <p className="text-sm text-vista-text-secondary mt-1">{subscription.daysRemaining} روز باقی‌مانده</p>
          )}
        </div>
      )}

      <div className="space-y-3 mb-8">
        {plans.map(plan => (
          <button
            key={plan.id}
            onClick={() => handlePurchase(plan.id)}
            disabled={!!purchasing}
            className={`w-full p-4 rounded-2xl border-2 text-right transition-all ${
              plan.recommended ? 'border-vista-primary bg-vista-primary/5' : 'border-vista-border dark:border-vista-border-dark'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{plan.label}</p>
                <p className="text-vista-primary font-semibold">{plan.price} <span className="text-xs text-vista-text-secondary font-normal">{plan.period}</span></p>
              </div>
              {plan.recommended && <span className="text-xs bg-vista-primary text-white px-2 py-0.5 rounded-full">پیشنهادی</span>}
              {purchasing === plan.id && <Loader2 className="w-5 h-5 animate-spin text-vista-primary" />}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold mb-3">امکانات Premium:</p>
        {features.map(f => (
          <div key={f} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-vista-success shrink-0" />
            {f}
          </div>
        ))}
      </div>
    </SettingsPageShell>
  )
}
