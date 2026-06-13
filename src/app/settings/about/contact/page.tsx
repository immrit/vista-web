'use client'

import { useState } from 'react'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { apiClient } from '@/lib/apiClient'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const [form, setForm] = useState({ full_name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await apiClient.post('/v1/contact-requests', {
        ...form,
        category: 'general',
        priority: 'normal',
      })
      toast.success('پیام شما ارسال شد')
      setForm({ full_name: '', email: '', subject: '', message: '' })
    } catch {
      toast.error('خطا در ارسال پیام')
    } finally {
      setSending(false)
    }
  }

  return (
    <SettingsPageShell title="تماس با ما" backHref="/settings/about">
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'full_name', label: 'نام کامل', type: 'text' },
          { key: 'email', label: 'ایمیل', type: 'email' },
          { key: 'subject', label: 'موضوع', type: 'text' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1.5">{label}</label>
            <input
              type={type}
              required
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="input-vista"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1.5">پیام</label>
          <textarea
            required
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={5}
            className="input-vista resize-none"
          />
        </div>
        <button type="submit" disabled={sending} className="btn-vista w-full flex items-center justify-center gap-2">
          {sending && <Loader2 className="w-5 h-5 animate-spin" />}
          ارسال
        </button>
      </form>
    </SettingsPageShell>
  )
}
