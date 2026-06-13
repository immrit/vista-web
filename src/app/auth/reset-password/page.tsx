'use client'

import { FormEvent, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { AnimatedRibbonBackground } from '@/components/auth/AnimatedRibbonBackground'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/apiClient'

type RecoveryOption = {
  id: string
  method: string
  masked: string
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vista-primary" />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  )
}

function ResetPasswordInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [options, setOptions] = useState<RecoveryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const prefill = params.get('prefill')?.trim()
    if (prefill) setIdentifier(prefill)
  }, [params])

  const loadOptions = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!identifier.trim()) {
      setError('شماره موبایل، ایمیل یا نام کاربری را وارد کنید')
      return
    }

    setLoading(true)
    setError(null)
    setOptions([])

    try {
      const data = await apiClient.post<{ options?: RecoveryOption[] }>('/v1/auth/recovery-options', {
        identifier: identifier.trim(),
      })
      const items = data.options || []
      setOptions(items)
      if (items.length === 0) {
        setError('راه بازیابی فعالی برای این حساب پیدا نشد')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت گزینه‌های بازیابی')
    } finally {
      setLoading(false)
    }
  }

  const sendRecovery = async (optionId: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.post('/v1/auth/recovery-send', { option_id: optionId })
      router.push(`/auth/reset-password/confirm?option=${encodeURIComponent(optionId)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال کد بازیابی ناموفق بود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden">
      <AnimatedRibbonBackground />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <button
          type="button"
          onClick={() => router.push('/auth')}
          className="mb-6 inline-flex items-center gap-2 self-start text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </button>

        <h1 className="mb-2 text-center text-2xl font-bold">بازیابی رمز عبور</h1>
        <p className="mb-8 text-center text-sm text-zinc-500">برای ادامه، نام کاربری یا اطلاعات ورود را وارد کنید</p>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={loadOptions} className="space-y-4">
          <Input
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="شماره موبایل، ایمیل یا نام کاربری"
            dir="ltr"
            className="text-left"
          />
          <Button type="submit" loading={loading} className="w-full btn-vista">
            ادامه
          </Button>
        </form>

        {options.length > 0 && (
          <div className="mt-6 space-y-2">
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                disabled={loading}
                onClick={() => sendRecovery(option.id)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-right hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <p className="font-medium">{option.method === 'sms' ? 'پیامک' : 'ایمیل'}</p>
                <p className="text-sm text-zinc-500" dir="ltr">{option.masked}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
