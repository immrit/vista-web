'use client'

import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'

export default function TermsPage() {
  return (
    <SettingsPageShell title="شرایط و قوانین" backHref="/settings/about">
      <div className="prose prose-sm dark:prose-invert max-w-none text-vista-text-primary dark:text-vista-text-primary-dark leading-relaxed space-y-4">
        <p>با استفاده از پلتفرم Vista، شما موافقت می‌کنید که از خدمات ما مطابق با قوانین جمهوری اسلامی ایران و این شرایط استفاده کنید.</p>
        <h3 className="font-bold text-base">۱. حساب کاربری</h3>
        <p>هر کاربر مسئول حفظ امنیت حساب خود است. ارائه اطلاعات نادرست ممنوع است.</p>
        <h3 className="font-bold text-base">۲. محتوا</h3>
        <p>کاربران مسئول محتوایی هستند که منتشر می‌کنند. محتوای غیرقانونی، توهین‌آمیز یا نقض حقوق دیگران حذف خواهد شد.</p>
        <h3 className="font-bold text-base">۳. حریم خصوصی</h3>
        <p>اطلاعات شخصی شما مطابق سیاست حریم خصوصی Vista محافظت می‌شود.</p>
        <h3 className="font-bold text-base">۴. مالکیت معنوی</h3>
        <p>تمام حقوق برند Vista متعلق به تیم Vista است. کاربران مالک محتوای خود باقی می‌مانند.</p>
        <h3 className="font-bold text-base">۵. تعلیق حساب</h3>
        <p>Vista حق تعلیق یا حذف حساب‌های متخلف را دارد.</p>
      </div>
    </SettingsPageShell>
  )
}
