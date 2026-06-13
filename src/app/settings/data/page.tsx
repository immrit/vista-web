'use client'

import { useState, useEffect } from 'react'
import { Wifi, Image, Video, Trash2 } from 'lucide-react'
import {
  SettingsPageShell, SettingsSection, SettingsGroup, SettingsSwitch, SettingsChoice, SettingsTile,
} from '@/components/settings/VistaSettingsWidgets'
import { useDataStorageSettings } from '@/hooks/useSettingsData'
import { toast } from 'sonner'

type Quality = 'high' | 'standard' | 'data_saver'

export default function DataStoragePage() {
  const storage = useDataStorageSettings()
  const [videoAutoPlay, setVideoAutoPlay] = useState(true)
  const [videoDataSaver, setVideoDataSaver] = useState(false)
  const [uploadQuality, setUploadQuality] = useState<Quality>('standard')

  useEffect(() => {
    const s = storage.get()
    setVideoAutoPlay(s.videoAutoPlay !== false)
    setVideoDataSaver(Boolean(s.videoDataSaver))
    setUploadQuality((s.uploadQuality as Quality) || 'standard')
  }, [storage])

  const clearCache = async () => {
    if ('caches' in window) {
      const names = await caches.keys()
      await Promise.all(names.map(n => caches.delete(n)))
    }
    toast.success('کش پاک شد')
  }

  return (
    <SettingsPageShell title="داده و ذخیره‌سازی">
      <SettingsSection title="پخش ویدیو در فید">
        <SettingsGroup>
          <SettingsSwitch
            icon={Video}
            title="پخش خودکار ویدیو"
            checked={videoAutoPlay}
            onChange={v => { setVideoAutoPlay(v); storage.set('vista_video_autoplay', String(v)) }}
          />
          <SettingsSwitch
            icon={Wifi}
            title="صرفه‌جویی داده"
            subtitle="کیفیت پایین‌تر برای اینترنت موبایل"
            checked={videoDataSaver}
            onChange={v => { setVideoDataSaver(v); storage.set('vista_video_data_saver', String(v)) }}
          />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="کیفیت آپلود">
        <SettingsGroup>
          <SettingsChoice<Quality>
            icon={Image}
            title="کیفیت رسانه"
            value={uploadQuality}
            options={[
              { value: 'high', label: 'بالا' },
              { value: 'standard', label: 'استاندارد' },
              { value: 'data_saver', label: 'صرفه‌جویی' },
            ]}
            onChange={v => { setUploadQuality(v); storage.set('vista_upload_quality', v) }}
          />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="ذخیره‌سازی">
        <SettingsGroup>
          <SettingsTile icon={Trash2} title="پاک کردن کش" subtitle="فایل‌های موقت مرورگر" onClick={clearCache} showArrow={false} />
        </SettingsGroup>
      </SettingsSection>
    </SettingsPageShell>
  )
}
