'use client'

import { SettingsPageShell, SettingsSection, SettingsGroup, SettingsTile } from '@/components/settings/VistaSettingsWidgets'
import { Info, FileText, Shield, HelpCircle, Mail, Star } from 'lucide-react'

export default function AboutSettingsPage() {
  return (
    <SettingsPageShell title="درباره ویستا">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-vista-gradient flex items-center justify-center">
          <span className="font-bauhaus text-3xl text-white">V</span>
        </div>
        <h2 className="font-bauhaus text-2xl vista-gradient-text">Vista</h2>
        <p className="text-sm text-vista-text-secondary mt-1">پلتفرم اجتماعی فارسی</p>
      </div>

      <SettingsSection title="اطلاعات و پشتیبانی">
        <SettingsGroup>
          <SettingsTile icon={Info} title="درباره ویستا" href="/settings/about/slideshow" />
          <SettingsTile icon={FileText} title="شرایط و قوانین" href="/settings/about/terms" />
          <SettingsTile icon={Shield} title="سیاست حریم خصوصی" href="/settings/about/privacy-policy" />
          <SettingsTile icon={HelpCircle} title="سوالات متداول" href="/settings/about/faq" />
          <SettingsTile icon={Mail} title="تماس با ما" href="/settings/about/contact" />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="فنی">
        <SettingsGroup>
          <SettingsTile icon={Star} title="نسخه برنامه" subtitle="2.5.0" showArrow={false} />
        </SettingsGroup>
      </SettingsSection>
    </SettingsPageShell>
  )
}
