'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Zap } from 'lucide-react'
import {
  SettingsPageShell, SettingsSection, SettingsGroup, SettingsChoice, SettingsSwitch,
} from '@/components/settings/VistaSettingsWidgets'
import { useThemeSettings } from '@/hooks/useSettingsData'

type ThemeMode = 'system' | 'light' | 'dark'

export default function ThemeSettingsPage() {
  const themeApi = useThemeSettings()
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const s = themeApi.get()
    setTheme(s.theme as ThemeMode)
    setReduceMotion(s.reduceMotion)
  }, [themeApi])

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode)
    themeApi.set('vista_theme', mode)
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  return (
    <SettingsPageShell title="ظاهر">
      <SettingsSection title="پوسته">
        <SettingsGroup>
          <SettingsChoice<ThemeMode>
            icon={Monitor}
            title="حالت نمایش"
            value={theme}
            options={[
              { value: 'system', label: 'سیستم' },
              { value: 'light', label: 'روشن' },
              { value: 'dark', label: 'تاریک' },
            ]}
            onChange={applyTheme}
          />
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="تجربه کاربری">
        <SettingsGroup>
          <SettingsSwitch
            icon={Zap}
            title="کاهش انیمیشن"
            subtitle="برای دسترس‌پذیری بهتر"
            checked={reduceMotion}
            onChange={v => {
              setReduceMotion(v)
              themeApi.set('vista_reduce_motion', String(v))
              document.documentElement.classList.toggle('reduce-motion', v)
            }}
          />
        </SettingsGroup>
      </SettingsSection>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { mode: 'light' as const, icon: Sun, label: 'روشن' },
          { mode: 'dark' as const, icon: Moon, label: 'تاریک' },
          { mode: 'system' as const, icon: Monitor, label: 'سیستم' },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => applyTheme(mode)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              theme === mode ? 'border-vista-primary bg-vista-primary/5' : 'border-vista-border dark:border-vista-border-dark'
            }`}
          >
            <Icon className={`w-8 h-8 ${theme === mode ? 'text-vista-primary' : ''}`} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </SettingsPageShell>
  )
}
