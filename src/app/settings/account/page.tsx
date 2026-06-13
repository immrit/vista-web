'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UploadService } from '@/lib/uploadService'
import { profileApi } from '@/lib/backendApi'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AccountSettingsPage() {
  const { profile, updateProfile, loading } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    username: '', full_name: '', bio: '', email: '',
    show_email: false, show_birth_date: false, show_gender: false, show_marital_status: false,
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        email: profile.email || '',
        show_email: Boolean((profile as Record<string, unknown>).show_email),
        show_birth_date: Boolean((profile as Record<string, unknown>).show_birth_date),
        show_gender: Boolean((profile as Record<string, unknown>).show_gender),
        show_marital_status: Boolean((profile as Record<string, unknown>).show_marital_status),
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
      await updateProfile(form)
      toast.success('پروفایل ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره پروفایل')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <SettingsPageShell title="حساب کاربری">
      <div className="flex flex-col items-center mb-8">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative group"
        >
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
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f) }} />
      </div>

      <div className="space-y-4">
        {[
          { key: 'full_name', label: 'نام کامل', type: 'text' },
          { key: 'username', label: 'نام کاربری', type: 'text' },
          { key: 'email', label: 'ایمیل', type: 'email' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1.5">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form] as string}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="input-vista"
              dir={key === 'username' ? 'ltr' : undefined}
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1.5">بیو</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            maxLength={160}
            className="input-vista resize-none"
            placeholder="درباره خود بنویسید..."
          />
          <p className="text-xs text-vista-text-secondary mt-1 text-left">{form.bio.length}/160</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-vista w-full flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-5 h-5 animate-spin" />}
          ذخیره تغییرات
        </button>
      </div>
    </SettingsPageShell>
  )
}
