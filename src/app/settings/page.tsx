'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  User, Shield, Bell, Languages, Palette, HardDrive, Bookmark, Lock,
  FileText, Info, LogOut, Crown, ChevronLeft, Trash2,
} from 'lucide-react'
import {
  SettingsSection, SettingsGroup, SettingsTile,
} from '@/components/settings/VistaSettingsWidgets'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { profile, signOut, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    if (!confirm('آیا از خروج از حساب کاربری اطمینان دارید؟')) return
    await signOut()
    toast.success('با موفقیت خارج شدید')
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <MobileTopBar title="تنظیمات" showLogo={false} showNotifications={false}>
        <h1 className="font-bold text-lg">تنظیمات</h1>
      </MobileTopBar>

      <div className="feed-container lg:pt-8 px-4 py-4 max-w-2xl pb-24">
        <h1 className="hidden lg:block text-2xl font-bold mb-6">تنظیمات</h1>

        {/* Profile card */}
        <Link
          href="/settings/account"
          className="flex items-center gap-4 p-4 mb-6 bg-vista-surface dark:bg-vista-surface-dark rounded-2xl border border-vista-border dark:border-vista-border-dark hover:border-vista-primary/30 transition-colors"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-vista-primary/20" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-vista-gradient flex items-center justify-center text-white text-xl font-bold">
              {(profile?.full_name || profile?.username || 'و').charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">{profile?.full_name || profile?.username}</p>
            <p className="text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark truncate">@{profile?.username}</p>
            {profile?.email && (
              <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark truncate mt-0.5">{profile.email}</p>
            )}
          </div>
          <ChevronLeft className="w-5 h-5 text-vista-text-secondary rotate-180 shrink-0" />
        </Link>

        {/* Premium banner */}
        <Link
          href="/settings/premium"
          className="block mb-6 p-5 rounded-2xl bg-vista-gradient text-white shadow-lg shadow-vista-primary/25 hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Vista Premium</p>
              <p className="text-sm text-white/80">نشان طلایی، استوری ۴۸ ساعته و امکانات ویژه</p>
            </div>
          </div>
        </Link>

        <SettingsSection title="حساب و ترجیحات">
          <SettingsGroup>
            <SettingsTile icon={User} title="حساب کاربری" href="/settings/account" />
            <SettingsTile icon={Shield} title="حریم خصوصی و امنیت" href="/settings/privacy" />
            <SettingsTile icon={Bell} title="اعلان‌ها" href="/settings/notifications" />
            <SettingsTile icon={Languages} title="زبان" subtitle="فارسی" href="/settings/theme" />
            <SettingsTile icon={Palette} title="ظاهر" href="/settings/theme" />
            <SettingsTile icon={HardDrive} title="داده و ذخیره‌سازی" href="/settings/data" />
            <SettingsTile icon={Bookmark} title="ذخیره‌شده‌ها" href="/settings/saved" />
            <SettingsTile icon={Lock} title="تغییر رمز عبور" href="/settings/change-password" />
            <SettingsTile icon={Trash2} title="حذف حساب کاربری" href="/settings/delete-account" destructive />
          </SettingsGroup>
        </SettingsSection>

        <SettingsSection title="قوانین و درباره">
          <SettingsGroup>
            <SettingsTile icon={FileText} title="شرایط و قوانین" href="/settings/about/terms" />
            <SettingsTile icon={Info} title="درباره ویستا" href="/settings/about" />
          </SettingsGroup>
        </SettingsSection>

        <SettingsSection title="">
          <SettingsGroup>
            <SettingsTile icon={LogOut} title="خروج از حساب" onClick={handleLogout} destructive showArrow={false} />
          </SettingsGroup>
        </SettingsSection>

        <p className="text-center text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark mt-8">
          Vista Web v2.5.0
        </p>
      </div>
    </>
  )
}
