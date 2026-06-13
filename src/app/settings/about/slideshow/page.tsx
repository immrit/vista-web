'use client'

import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'

const slides = [
  { title: 'به Vista خوش آمدید', desc: 'پلتفرم اجتماعی فارسی برای اشتراک لحظات، استوری و پیام‌رسانی' },
  { title: 'فید شخصی‌سازی شده', desc: 'پست‌های مورد علاقه‌تان را کشف کنید و با جامعه ارتباط برقرار کنید' },
  { title: 'پیام‌رسانی حرفه‌ای', desc: 'چت امن با پشتیبانی از رسانه، واکنش و رمزنگاری' },
  { title: 'استوری و Notes', desc: 'لحظات ۲۴ ساعته خود را به اشتراک بگذارید' },
  { title: 'حریم خصوصی', desc: 'کنترل کامل بر روی اینکه چه کسی محتوای شما را می‌بیند' },
  { title: 'Vista Premium', desc: 'امکانات ویژه برای خالقان محتوا' },
]

export default function AboutSlideshowPage() {
  return (
    <SettingsPageShell title="درباره Vista" backHref="/settings/about">
      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div key={i} className="p-5 rounded-2xl bg-vista-surface dark:bg-vista-surface-dark border border-vista-border dark:border-vista-border-dark">
            <span className="text-xs font-bold text-vista-primary mb-2 block">{i + 1} / {slides.length}</span>
            <h3 className="font-bold text-lg mb-2">{slide.title}</h3>
            <p className="text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark leading-relaxed">{slide.desc}</p>
          </div>
        ))}
      </div>
    </SettingsPageShell>
  )
}
