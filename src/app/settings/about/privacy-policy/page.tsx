'use client'

import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'

export default function PrivacyPolicyPage() {
  return (
    <SettingsPageShell title="سیاست حریم خصوصی" backHref="/settings/about">
      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed space-y-4">
        <p>Vista متعهد به حفاظت از حریم خصوصی کاربران است.</p>
        <h3 className="font-bold text-base">اطلاعات جمع‌آوری شده</h3>
        <p>شماره موبایل، ایمیل، نام کاربری، تصویر پروفایل و محتوای منتشرشده.</p>
        <h3 className="font-bold text-base">نحوه استفاده</h3>
        <p>برای ارائه خدمات، بهبود تجربه کاربری و امنیت پلتفرم.</p>
        <h3 className="font-bold text-base">اشتراک‌گذاری</h3>
        <p>اطلاعات شخصی بدون رضایت شما به اشخاص ثالث فروخته نمی‌شود.</p>
        <h3 className="font-bold text-base">حقوق شما</h3>
        <p>می‌توانید حساب خود را حذف کنید یا تنظیمات حریم خصوصی را تغییر دهید.</p>
      </div>
    </SettingsPageShell>
  )
}
