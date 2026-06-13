'use client'

import { Lock, MessageSquare, Users, Eye, Shield, Smartphone, Trash2 } from 'lucide-react'
import {
  SettingsPageShell, SettingsSection, SettingsGroup, SettingsSwitch, SettingsChoice, SettingsTile,
} from '@/components/settings/VistaSettingsWidgets'
import { usePrivacySettings } from '@/hooks/useSettingsData'

type Visibility = 'everyone' | 'my_contacts' | 'nobody' | 'followers' | 'following'

export default function PrivacySettingsPage() {
  const { settings, isLoading, update, isSaving } = usePrivacySettings()

  const set = async (key: string, value: unknown) => {
    await update({ ...settings, [key]: value })
  }

  if (isLoading) {
    return (
      <SettingsPageShell title="حریم خصوصی و امنیت">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </SettingsPageShell>
    )
  }

  return (
    <SettingsPageShell title="حریم خصوصی و امنیت">
      <SettingsSection title="حریم خصوصی">
        <SettingsGroup>
          <SettingsSwitch
            icon={Lock}
            title="حساب خصوصی"
            subtitle="فقط دنبال‌کنندگان پست‌های شما را می‌بینند"
            checked={Boolean(settings.is_private)}
            onChange={v => set('is_private', v)}
            disabled={isSaving}
          />
          <SettingsChoice<Visibility>
            icon={Eye}
            title="آخرین بازدید"
            value={(settings.last_seen_visibility as Visibility) || 'everyone'}
            options={[
              { value: 'everyone', label: 'همه' },
              { value: 'my_contacts', label: 'مخاطبین من' },
              { value: 'nobody', label: 'هیچ‌کس' },
            ]}
            onChange={v => set('last_seen_visibility', v)}
          />
          <SettingsChoice<Visibility>
            icon={MessageSquare}
            title="چه کسی می‌تواند پیام دهد"
            value={(settings.message_privacy as Visibility) || 'everyone'}
            options={[
              { value: 'everyone', label: 'همه' },
              { value: 'followers', label: 'دنبال‌کنندگان' },
              { value: 'nobody', label: 'هیچ‌کس' },
            ]}
            onChange={v => set('message_privacy', v)}
          />
          <SettingsChoice<Visibility>
            icon={Users}
            title="افزودن به گروه"
            value={(settings.group_add_privacy as Visibility) || 'everyone'}
            options={[
              { value: 'everyone', label: 'همه' },
              { value: 'following', label: 'دنبال‌شوندگان' },
              { value: 'nobody', label: 'هیچ‌کس' },
            ]}
            onChange={v => set('group_add_privacy', v)}
          />
          <SettingsSwitch
            icon={Eye}
            title="رسید خوانده شدن"
            checked={settings.send_read_receipts !== false}
            onChange={v => set('send_read_receipts', v)}
            disabled={isSaving}
          />
          <SettingsTile icon={Shield} title="کاربران مسدود" href="/settings/privacy/blocked" />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="امنیت">
        <SettingsGroup>
          <SettingsTile icon={Smartphone} title="نشست‌های فعال" href="/settings/privacy/sessions" />
          <SettingsTile icon={Trash2} title="حذف حساب کاربری" href="/settings/delete-account" destructive />
          <SettingsSwitch
            icon={Shield}
            title="احراز هویت دو مرحله‌ای"
            checked={Boolean(settings.two_factor_enabled)}
            onChange={v => set('two_factor_enabled', v)}
            disabled={isSaving}
          />
        </SettingsGroup>
      </SettingsSection>
    </SettingsPageShell>
  )
}
