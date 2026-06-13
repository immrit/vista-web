'use client'

import { FormEvent, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { AnimatedRibbonBackground } from '@/components/auth/AnimatedRibbonBackground'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/apiClient'

function ResetPasswordConfirmInner() {
  const router = useRouter()
  const params = useSearchParams()
  const optionId = params.get('option') || ''

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!optionId || !code.trim()) return

    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.post<{ password_reset_token?: string }>('/v1/auth/recovery-verify', {
        option_id: optionId,
        code: code.trim(),
      })
      if (!data.password_reset_token) throw new Error('توکن بازیابی دریافت نشد')
      setSessionToken(data.password_reset_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'کد نامعتبر است')
    } finally {
      setLoading(false)
    }
  }

  const completeReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!sessionToken) return
    if (password.length < 8) { setError('رمز عبور حداقل ۸ کاراکتر'); return }
    if (password !== confirm) { setError('رمز و تایید مطابقت ندارند'); return }

    setLoading(true)
    setError(null)
    try {
      await apiClient.post('/v1/auth/recovery-complete', {
        password_reset_token: sessionToken,
        new_password: password,
      })
      router.replace('/auth')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تغییر رمز ناموفق بود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden">
      <AnimatedRibbonBackground />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <button type="button" onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 self-start text-sm text-zinc-500">
          <ArrowRight className="h-4 w-4" /> بازگشت
        </button>

        <h1 className="mb-8 text-center text-2xl font-bold">
          {sessionToken ? 'رمز عبور جدید' : 'کد بازیابی'}
        </h1>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {!sessionToken ? (
          <form onSubmit={verifyCode} className="space-y-4">
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="کد بازیابی" dir="ltr" className="text-center" />
            <Button type="submit" loading={loading} className="w-full btn-vista">تایید کد</Button>
          </form>
        ) : (
          <form onSubmit={completeReset} className="space-y-4">
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز جدید" dir="ltr" />
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="تایید رمز" dir="ltr" />
            <Button type="submit" loading={loading} className="w-full btn-vista">ثبت رمز جدید</Button>
          </form>
        )}
      </div>
    </main>
  )
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vista-primary" />
      </div>
    }>
      <ResetPasswordConfirmInner />
    </Suspense>
  )
}
