'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UploadService } from '@/lib/uploadService'
import { profileApi } from '@/lib/backendApi'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { Camera, Loader2, Globe, Calendar, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/theme/cn'

type Visibility = 'public' | 'followers' | 'private'

interface ProfileForm {
  username: string
  full_name: string
  bio: string
  note: string
  email: string
  website: string
  birth_date: string
  gender: string
  marital_status: string
  email_visibility: Visibility
  birth_date_visibility: Visibility
  gender_visibility: Visibility
  marital_status_visibility: Visibility
}

const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: 'همه',
  followers: 'دنبال‌کنندگان',
  private: 'فقط من',
}

function VisibilitySelect({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as Visibility)}
        className="appearance-none bg-vista-surface-variant dark:bg-vista-surface-variant-dark text-xs px-3 py-1.5 rounded-xl pr-7 outline-none border border-vista-border dark:border-vista-border-dark cursor-pointer"
      >
        {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-vista-text-secondary dark:text-vista-text-secondary-dark" />
    </div>
  )
}

function profileCompletion(form: ProfileForm, hasAvatar: boolean): number {
  const fields = [
    Boolean(form.full_name),
    Boolean(form.username),
    Boolean(form.bio),
    Boolean(form.birth_date),
    Boolean(form.gender),
    Boolean(form.website),
    hasAvatar,
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

export default function AccountSettingsPage() {
  const { profile, updateProfile, loading } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ProfileForm>({
    username: '', full_name: '', bio: '', note: '', email: '',
    website: '', birth_date: '', gender: '', marital_status: '',
    email_visibility: 'followers',
    birth_date_visibility: 'followers',
    gender_visibility: 'public',
    marital_status_visibility: 'public',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        note: profile.note || '',
        email: profile.email || '',
        website: profile.website || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        marital_status: profile.marital_status || '',
        email_visibility: (profile.email_visibility as Visibility) || 'followers',
        birth_date_visibility: (profile.birth_date_visibility as Visibility) || 'followers',
        gender_visibility: (profile.gender_visibility as Visibility) || 'public',
        marital_status_visibility: (profile.marital_status_visibility as Visibility) || 'public',
      })
    }
  }, [profile])

  const handleAvatar = async (file: File) => {
    if (!profile?.id) return
    setUploadingAvatar(true)
    try {
      const url = await UploadService.uploadAvatar(file, profile.id)
      await updateProfile({ avatar_url: url })
      toast.success('آواتار به‌روز شد')
    } catch {
      toast.error('خطا در آپلود آواتار')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await profileApi.update(form)
      await updateProfile(form as Partial<typeof profile>)
      toast.success('پروفایل ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره پروفایل')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  const completion = profileCompletion(form, Boolean(profile?.avatar_url))

  const field = (key: keyof ProfileForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  })

  return (
    <SettingsPageShell title="حساب کاربری">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-vista-primary/20" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-vista-gradient flex items-center justify-center text-white text-2xl font-bold">
              {(form.full_name || form.username || 'و').charAt(0)}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-8 h-8 bg-vista-primary rounded-full flex items-center justify-center text-white shadow-lg">
            {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f) }} />

        {/* Profile completion bar */}
        <div className="mt-4 w-full max-w-xs">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-vista-text-secondary dark:text-vista-text-secondary-dark">تکمیل پروفایل</span>
            <span className={cn('font-bold', completion >= 80 ? 'text-vista-success' : completion >= 50 ? 'text-amber-500' : 'text-vista-error')}>
              {completion}٪
            </span>
          </div>
          <div className="h-2 rounded-full bg-vista-surface-variant dark:bg-vista-surface-variant-dark overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', completion >= 80 ? 'bg-vista-success' : completion >= 50 ? 'bg-amber-500' : 'bg-vista-error')}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Basic info */}
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark">اطلاعات اصلی</h3>
          {[
            { key: 'full_name' as const, label: 'نام کامل', type: 'text' },
            { key: 'username' as const, label: 'نام کاربری', type: 'text', ltr: true },
          ].map(({ key, label, type, ltr }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input type={type} {...field(key)} className="input-vista" dir={ltr ? 'ltr' : undefined} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5">بیو</label>
            <textarea
              {...field('bio')}
              rows={3}
              maxLength={160}
              className="input-vista resize-none"
              placeholder="درباره خود بنویسید..."
            />
            <p className="text-xs text-vista-text-secondary mt-1 text-left">{form.bio.length}/160</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">یادداشت (وضعیت)</label>
            <input
              type="text"
              {...field('note')}
              maxLength={60}
              className="input-vista"
              placeholder="یه چیزی درباره حالت بنویس..."
            />
            <p className="text-xs text-vista-text-secondary mt-1 text-left">{form.note.length}/60</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
              <Globe className="w-4 h-4 text-vista-text-secondary" />
              وب‌سایت
            </label>
            <input type="url" {...field('website')} className="input-vista" dir="ltr" placeholder="https://example.com" />
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark">تماس</h3>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">ایمیل</label>
              <VisibilitySelect value={form.email_visibility} onChange={v => setForm(f => ({ ...f, email_visibility: v }))} />
            </div>
            <input type="email" {...field('email')} className="input-vista" dir="ltr" />
          </div>
        </div>

        {/* Personal info */}
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark">اطلاعات شخصی</h3>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4 text-vista-text-secondary" />
                تاریخ تولد
              </label>
              <VisibilitySelect value={form.birth_date_visibility} onChange={v => setForm(f => ({ ...f, birth_date_visibility: v }))} />
            </div>
            <input type="date" {...field('birth_date')} className="input-vista" dir="ltr" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">جنسیت</label>
              <VisibilitySelect value={form.gender_visibility} onChange={v => setForm(f => ({ ...f, gender_visibility: v }))} />
            </div>
            <select {...field('gender')} className="input-vista appearance-none">
              <option value="">انتخاب نکنید</option>
              <option value="male">مرد</option>
              <option value="female">زن</option>
              <option value="other">سایر</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">وضعیت تأهل</label>
              <VisibilitySelect value={form.marital_status_visibility} onChange={v => setForm(f => ({ ...f, marital_status_visibility: v }))} />
            </div>
            <select {...field('marital_status')} className="input-vista appearance-none">
              <option value="">انتخاب نکنید</option>
              <option value="single">مجرد</option>
              <option value="married">متأهل</option>
              <option value="divorced">جدا شده</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-vista w-full flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-5 h-5 animate-spin" />}
          ذخیره تغییرات
        </button>
      </div>
    </SettingsPageShell>
  )
}
