'use client'

import { useState } from 'react'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { Search } from 'lucide-react'

const faqs = [
  { q: 'چگونه ثبت‌نام کنم؟', a: 'با شماره موبایل وارد شوید، کد OTP را وارد کنید و پروفایل خود را تکمیل کنید.' },
  { q: 'چگونه پست بگذارم؟', a: 'دکمه + در نوار پایین را بزنید و متن، تصویر یا ویدیو اضافه کنید.' },
  { q: 'حساب خصوصی چیست؟', a: 'در تنظیمات > حریم خصوصی می‌توانید حساب را خصوصی کنید تا فقط دنبال‌کنندگان پست‌ها را ببینند.' },
  { q: 'استوری چقدر نمایش داده می‌شود؟', a: 'استوری‌ها ۲۴ ساعت (یا ۴۸ ساعت برای Premium) نمایش داده می‌شوند.' },
  { q: 'Notes چیست؟', a: 'یادداشت کوتاه ۶۰ کاراکتری که ۲۴ ساعت روی پروفایل نمایش داده می‌شود.' },
  { q: 'چگونه Premium بگیرم؟', a: 'از تنظیمات > Vista Premium طرح مورد نظر را انتخاب کنید.' },
  { q: 'چگونه کاربر را مسدود کنم؟', a: 'از پروفایل کاربر یا داخل چت، گزینه مسدود کردن را انتخاب کنید.' },
  { q: 'رمز عبور را فراموش کردم', a: 'در صفحه ورود، شماره موبایل را وارد کنید و از OTP استفاده کنید.' },
]

export default function FAQPage() {
  const [query, setQuery] = useState('')
  const filtered = faqs.filter(f => f.q.includes(query) || f.a.includes(query))

  return (
    <SettingsPageShell title="سوالات متداول" backHref="/settings/about">
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vista-text-secondary" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="جستجو..."
          className="input-vista pr-10"
        />
      </div>
      <div className="space-y-3">
        {filtered.map((faq, i) => (
          <details key={i} className="group bg-vista-surface dark:bg-vista-surface-dark rounded-2xl border border-vista-border dark:border-vista-border-dark overflow-hidden">
            <summary className="px-4 py-3.5 font-medium cursor-pointer list-none flex items-center justify-between">
              {faq.q}
              <span className="text-vista-primary group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </SettingsPageShell>
  )
}
