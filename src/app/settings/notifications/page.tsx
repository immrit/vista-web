'use client'

import { Bell, MessageSquare, AtSign, Heart, Volume2, Vibrate, Moon } from 'lucide-react'
import {
  SettingsPageShell, SettingsSection, SettingsGroup, SettingsSwitch,
} from '@/components/settings/VistaSettingsWidgets'
import { useNotificationSettings } from '@/hooks/useSettingsData'

export default function NotificationSettingsPage() {
  const { settings, isLoading, update, isSaving } = useNotificationSettings()

  const set = async (key: string, value: unknown) => {
    await update({ ...settings, [key]: value })
  }

  const pushEnabled = settings.push_notifications !== false

  if (isLoading) {
    return (
      <SettingsPageShell title="اعلان‌ها">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </SettingsPageShell>
    )
  }

  return (
    <SettingsPageShell title="اعلان‌ها">
      <SettingsSection title="اعلان‌ها">
        <SettingsGroup>
          <SettingsSwitch icon={Bell} title="اعلان push" checked={pushEnabled} onChange={v => set('push_notifications', v)} disabled={isSaving} />
          <SettingsSwitch icon={MessageSquare} title="پیام‌ها" checked={settings.message_notifications !== false} onChange={v => set('message_notifications', v)} disabled={isSaving || !pushEnabled} />
          <SettingsSwitch icon={AtSign} title="منشن‌ها" checked={settings.mention_notifications !== false} onChange={v => set('mention_notifications', v)} disabled={isSaving || !pushEnabled} />
          <SettingsSwitch icon={Heart} title="لایک‌ها" checked={settings.like_notifications !== false} onChange={v => set('like_notifications', v)} disabled={isSaving || !pushEnabled} />
          <SettingsSwitch icon={MessageSquare} title="کامنت‌ها" checked={settings.comment_notifications !== false} onChange={v => set('comment_notifications', v)} disabled={isSaving || !pushEnabled} />
          <SettingsSwitch icon={Bell} title="دنبال‌کنندگان جدید" checked={settings.follow_notifications !== false} onChange={v => set('follow_notifications', v)} disabled={isSaving || !pushEnabled} />
          <SettingsSwitch icon={Bell} title="استوری‌ها" checked={settings.story_notifications !== false} onChange={v => set('story_notifications', v)} disabled={isSaving || !pushEnabled} />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="صدا">
        <SettingsGroup>
          <SettingsSwitch icon={Volume2} title="صدای اعلان" checked={settings.sound_enabled !== false} onChange={v => set('sound_enabled', v)} disabled={isSaving} />
          <SettingsSwitch icon={Vibrate} title="لرزش" checked={settings.vibration_enabled !== false} onChange={v => set('vibration_enabled', v)} disabled={isSaving} />
          <SettingsSwitch icon={MessageSquare} title="پیش‌نمایش پیام" checked={settings.show_message_preview !== false} onChange={v => set('show_message_preview', v)} disabled={isSaving} />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="ساعات سکوت">
        <SettingsGroup>
          <SettingsSwitch icon={Moon} title="ساعات سکوت" checked={Boolean(settings.quiet_hours_enabled)} onChange={v => set('quiet_hours_enabled', v)} disabled={isSaving} />
          {settings.quiet_hours_enabled && (
            <div className="px-4 py-3 flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-vista-text-secondary block mb-1">شروع</label>
                <input type="time" value={settings.quiet_hours_start || '22:00'} onChange={e => set('quiet_hours_start', e.target.value)} className="input-vista py-2" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-vista-text-secondary block mb-1">پایان</label>
                <input type="time" value={settings.quiet_hours_end || '08:00'} onChange={e => set('quiet_hours_end', e.target.value)} className="input-vista py-2" />
              </div>
            </div>
          )}
        </SettingsGroup>
      </SettingsSection>
    </SettingsPageShell>
  )
}
