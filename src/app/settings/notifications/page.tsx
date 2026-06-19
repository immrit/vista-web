'use client'

import { Bell, MessageSquare, AtSign, Heart, Volume2, Vibrate, Moon, Smartphone, Loader2 } from 'lucide-react'
import {
  SettingsPageShell, SettingsSection, SettingsGroup, SettingsSwitch,
} from '@/components/settings/VistaSettingsWidgets'
import { useNotificationSettings } from '@/hooks/useSettingsData'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationSettingsPage() {
  const { settings, isLoading, update, isSaving } = useNotificationSettings()
  const push = usePushNotifications()

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
      {/* Browser push subscription */}
      {push.isSupported && (
        <SettingsSection title="اعلان مرورگر (PWA)">
          <SettingsGroup>
            <div className="px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-vista-primary/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-vista-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{'اعلان PWA'}</p>
                  <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark">
                    {push.subscribed ? 'فعال است' : push.permission === 'denied' ? 'دسترسی رد شده' : 'غیرفعال'}
                  </p>
                </div>
              </div>
              {push.permission !== 'denied' && (
                <button
                  onClick={push.subscribed ? push.disable : push.enable}
                  disabled={push.loading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                    push.subscribed
                      ? 'bg-vista-error/10 text-vista-error hover:bg-vista-error/20'
                      : 'bg-vista-primary text-white hover:opacity-90'
                  }`}
                >
                  {push.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {push.subscribed ? 'غیرفعال' : 'فعال‌سازی'}
                </button>
              )}
            </div>
          </SettingsGroup>
        </SettingsSection>
      )}

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
