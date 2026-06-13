'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('رمز عبور حداقل ۸ کاراکتر'); return }
    if (password !== confirm) { toast.error('رمز و تایید مطابقت ندارند'); return }

    setSaving(true)
    try {
      await apiClient.post('/v1/auth/2fa/setup', { password, current_password: current })
      toast.success('رمز عبور تغییر کرد')
      setCurrent(''); setPassword(''); setConfirm('')
    } catch {
      toast.error('خطا در تغییر رمز عبور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsPageShell title="تغییر رمز عبور">
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'رمز عبور فعلی', value: current, set: setCurrent },
          { label: 'رمز عبور جدید', value: password, set: setPassword },
          { label: 'تایید رمز جدید', value: confirm, set: setConfirm },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-sm font-medium mb-1.5">{label}</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => set(e.target.value)}
                className="input-vista pl-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-vista-text-secondary">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ))}
        <button type="submit" disabled={saving} className="btn-vista w-full flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-5 h-5 animate-spin" />}
          ذخیره رمز جدید
        </button>
      </form>
    </SettingsPageShell>
  )
}
