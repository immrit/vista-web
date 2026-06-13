'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { profileApi } from '@/lib/backendApi'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/theme/cn'
import { toast } from 'sonner'

const GENDERS = [
  { value: 'male', label: 'مرد' },
  { value: 'female', label: 'زن' },
  { value: 'prefer_not_to_say', label: 'ترجیح می‌دهم نگویم' },
]

const MARITAL = [
  { value: 'single', label: 'مجرد' },
  { value: 'married', label: 'متأهل' },
  { value: 'prefer_not_to_say', label: 'ترجیح می‌دهم نگویم' },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, loading, refreshSession } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    username: '', full_name: '', email: '',
    birth_date: '', gender: '', marital_status: '',
  })

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
    if (!loading && user?.profile_completed) router.replace('/feed')
  }, [user, loading, router])

  const steps = ['اطلاعات پایه', 'تاریخ تولد', 'اطلاعات تکمیلی']

  const handleNext = async () => {
    if (step === 0) {
      if (!form.username.trim() || form.username.length < 3) { toast.error('نام کاربری حداقل ۳ کاراکتر'); return }
      if (!form.full_name.trim()) { toast.error('نام کامل را وارد کنید'); return }
    }
    if (step < 2) {
      setStep(s => s + 1)
    } else {
      setSaving(true)
      try {
        await profileApi.update(form)
        await refreshSession()
        toast.success('پروفایل تکمیل شد!')
        router.replace('/feed')
      } catch {
        toast.error('خطا در ذخیره پروفایل')
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vista-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-vista-bg dark:bg-vista-bg-dark px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-vista-text-secondary mb-3">
            <span>مرحله {step + 1} از 3</span>
            <span>{steps[step]}</span>
          </div>
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-vista-gradient' : 'bg-vista-border dark:bg-vista-border-dark')} />
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-2">اطلاعات پایه</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">نام کاربری</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} className="input-vista" dir="ltr" placeholder="username" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">نام کامل</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input-vista" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ایمیل (اختیاری)</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-vista" dir="ltr" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-2">تاریخ تولد</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">تاریخ تولد</label>
                <input type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} className="input-vista" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-2">اطلاعات تکمیلی</h2>
              <div>
                <label className="block text-sm font-medium mb-2">جنسیت</label>
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map(g => (
                    <button key={g.value} onClick={() => setForm(f => ({ ...f, gender: g.value }))} className={cn('px-4 py-2 rounded-2xl border text-sm font-medium transition-colors', form.gender === g.value ? 'border-vista-primary bg-vista-primary/10 text-vista-primary' : 'border-vista-border dark:border-vista-border-dark')}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">وضعیت تأهل</label>
                <div className="flex flex-wrap gap-2">
                  {MARITAL.map(m => (
                    <button key={m.value} onClick={() => setForm(f => ({ ...f, marital_status: m.value }))} className={cn('px-4 py-2 rounded-2xl border text-sm font-medium transition-colors', form.marital_status === m.value ? 'border-vista-primary bg-vista-primary/10 text-vista-primary' : 'border-vista-border dark:border-vista-border-dark')}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button onClick={handleNext} disabled={saving} className="btn-vista w-full mt-6 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {step < 2 ? 'ادامه' : 'تکمیل ثبت‌نام'}
            {step < 2 && <ArrowRight className="w-5 h-5 rotate-180" />}
          </button>
        </div>
      </div>
    </main>
  )
}
