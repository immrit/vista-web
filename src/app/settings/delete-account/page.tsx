'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Bookmark,
  Crown,
  Eye,
  Gamepad2,
  Loader2,
  Lock,
  MessageSquare,
  Music,
  Shield,
  Sparkles,
  Users,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

const DELETION_REASONS = [
  { value: 'not_using', label: 'دیگر از برنامه استفاده نمی‌کنم' },
  { value: 'privacy', label: 'نگرانی حریم خصوصی' },
  { value: 'notifications', label: 'اعلان‌های زیاد' },
  { value: 'alternative', label: 'جایگزین پیدا کردم' },
  { value: 'content_quality', label: 'کیفیت محتوا رضایت‌بخش نیست' },
  { value: 'technical_issues', label: 'مشکلات فنی' },
  { value: 'other', label: 'سایر' },
] as const

type DeletionReason = (typeof DELETION_REASONS)[number]['value']

type RetentionItem = {
  icon: LucideIcon
  text: string
  href?: string
}

type RetentionContent = {
  title: string
  subtitle: string
  items: RetentionItem[]
}

const REASON_RETENTION: Record<DeletionReason, RetentionContent> = {
  not_using: {
    title: 'با ماندن در Vista این‌ها را از دست نمی‌دهید',
    subtitle: 'حساب شما همین الان به این بخش‌ها متصل است:',
    items: [
      { icon: Users, text: 'دنبال‌کنندگان، دنبال‌شوندگان و تاریخچه تعاملات شما' },
      { icon: Bookmark, text: 'پست‌های ذخیره‌شده در تنظیمات > ذخیره‌شده‌ها', href: '/settings/saved' },
      { icon: MessageSquare, text: 'پیام‌های خصوصی، گروه‌ها و Notes در بخش پیام‌ها', href: '/messages' },
      { icon: Sparkles, text: 'استوری‌ها (۲۴ ساعت برای همه، ۴۸ ساعت با Premium)' },
      { icon: Music, text: 'پست‌های موزیک و ریل‌های آپلودشده در پروفایل' },
    ],
  },
  privacy: {
    title: 'قبل از حذف، تنظیمات حریم خصوصی واقعی Vista را ببینید',
    subtitle: 'می‌توانید بدون حذف حساب، کنترل بیشتری بگیرید:',
    items: [
      { icon: Lock, text: 'حساب خصوصی — فقط دنبال‌کنندگان پست‌ها را می‌بینند', href: '/settings/privacy' },
      { icon: Eye, text: 'کنترل «آخرین بازدید»، «چه کسی پیام دهد» و «افزودن به گروه»', href: '/settings/privacy' },
      { icon: Shield, text: 'مسدود کردن کاربران و مدیریت نشست‌های فعال', href: '/settings/privacy/blocked' },
      { icon: Shield, text: 'احراز هویت دو مرحله‌ای برای امنیت بیشتر ورود', href: '/settings/privacy' },
      { icon: Lock, text: 'حذف حساب ۳۰ روز مهلت دارد — در این مدت می‌توان درخواست را لغو کرد' },
    ],
  },
  notifications: {
    title: 'اعلان‌ها قابل تنظیم‌اند — لازم نیست حساب حذف شود',
    subtitle: 'از تنظیمات اعلان‌ها می‌توانید دقیقاً انتخاب کنید چه چیزی بیاید:',
    items: [
      { icon: Bell, text: 'فعال/غیرفعال کردن اعلان لایک، کامنت و دنبال‌کننده جدید', href: '/settings/notifications' },
      { icon: MessageSquare, text: 'کنترل اعلان پیام‌ها و درخواست‌های گفتگو', href: '/settings/notifications' },
      { icon: Sparkles, text: 'اعلان استوری و منشن را جداگانه مدیریت کنید', href: '/settings/notifications' },
      { icon: Bell, text: 'در مرورگر می‌توانید اعلان Vista را از تنظیمات سیستم هم محدود کنید' },
    ],
  },
  alternative: {
    title: 'چیزهایی که فقط در Vista دارید',
    subtitle: 'این امکانات واقعاً در پلتفرم فعال هستند:',
    items: [
      { icon: Sparkles, text: 'Notes — یادداشت ۶۰ کاراکتری ۲۴ ساعته روی پروفایل و در پیام‌ها' },
      { icon: Video, text: 'فید با تب «برای شما» و «دنبال‌شده‌ها» + استوری و پست ویدیو' },
      { icon: Music, text: 'تب موزیک در پروفایل برای اشتراک‌گذاری موسیقی' },
      { icon: Gamepad2, text: 'بخش بازی و مسابقات آنلاین (/game)', href: '/game' },
      { icon: Crown, text: 'Vista Premium: تیک طلایی، استوری ۴۸h، ویرایش پست، پست تا ۴٬۰۰۰ کاراکتر', href: '/settings/premium' },
    ],
  },
  content_quality: {
    title: 'فید Vista را می‌توانید شخصی‌تر کنید',
    subtitle: 'به‌جای حذف حساب، این گزینه‌های واقعی را امتحان کنید:',
    items: [
      { icon: Users, text: 'فید «دنبال‌شده‌ها» فقط محتوای افرادی را نشان می‌دهد که انتخاب کرده‌اید', href: '/feed' },
      { icon: Eye, text: 'از Explore کاربران و موضوعات جدید پیدا کنید', href: '/explore' },
      { icon: Shield, text: 'کاربر مزاحم را مسدود یا گزارش کنید', href: '/settings/privacy/blocked' },
      { icon: Lock, text: 'حساب خصوصی کنید تا کنترل بیشتری روی مخاطبین داشته باشید', href: '/settings/privacy' },
    ],
  },
  technical_issues: {
    title: 'مشکل فنی؟ اول پشتیبانی را امتحان کنید',
    subtitle: 'تیم Vista راه‌های واقعی برای کمک دارد:',
    items: [
      { icon: MessageSquare, text: 'تماس با پشتیبانی از تنظیمات > درباره > تماس با ما', href: '/settings/about/contact' },
      { icon: Sparkles, text: 'سوالات متداول شامل راه‌حل‌های ورود، OTP و آپلود', href: '/settings/about/faq' },
      { icon: Shield, text: 'پاکسازی کش از تنظیمات > داده و ذخیره‌سازی', href: '/settings/data' },
      { icon: Bell, text: 'خروج و ورود مجدد یا بررسی نشست‌های فعال', href: '/settings/privacy/sessions' },
    ],
  },
  other: {
    title: 'چرا بسیاری در Vista می‌مانند',
    subtitle: 'خلاصه امکانات واقعی پلتفرم:',
    items: [
      { icon: MessageSquare, text: 'پیام‌رسانی، Notes و چت گروهی' },
      { icon: Sparkles, text: 'استوری، پست، ریل و موزیک در یک پروفایل' },
      { icon: Lock, text: 'تنظیمات حریم خصوصی و امنیت (خصوصی، 2FA، مسدودسازی)', href: '/settings/privacy' },
      { icon: Crown, text: 'Premium با تیک طلایی، استوری ۴۸ ساعته و ویرایش پست', href: '/settings/premium' },
      { icon: Gamepad2, text: 'بازی و مسابقات آنلاین', href: '/game' },
    ],
  },
}

function ReasonRetentionPanel({ reason }: { reason: DeletionReason }) {
  const content = REASON_RETENTION[reason]

  return (
    <div className="mt-4 rounded-2xl border border-vista-primary/20 bg-vista-primary/5 dark:bg-vista-primary/10 p-4 animate-fade-up">
      <p className="font-semibold text-vista-primary text-sm mb-1">{content.title}</p>
      <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark mb-3 leading-relaxed">
        {content.subtitle}
      </p>
      <ul className="space-y-2.5">
        {content.items.map((item, i) => {
          const Icon = item.icon
          const inner = (
            <>
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-vista-primary/10">
                <Icon className="h-3.5 w-3.5 text-vista-primary" />
              </span>
              <span className="text-vista-text-primary dark:text-vista-text-primary-dark">{item.text}</span>
            </>
          )
          if (item.href) {
            return (
              <li key={i}>
                <Link href={item.href} className="flex items-start gap-2.5 text-sm leading-relaxed rounded-xl hover:bg-vista-primary/5 transition-colors -mx-1 px-1 py-0.5">
                  {inner}
                </Link>
              </li>
            )
          }
          return (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
              {inner}
            </li>
          )
        })}
      </ul>
      <Link
        href="/settings"
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-vista-primary/30 bg-vista-surface dark:bg-vista-surface-dark py-2.5 text-sm font-medium text-vista-primary hover:bg-vista-primary/10 transition-colors"
      >
        فعلاً می‌مانم
      </Link>
    </div>
  )
}

export default function DeleteAccountPage() {
  const router = useRouter()
  const { user, requestAccountDeletionOtp, confirmAccountDeletion, signOut } = useAuth()

  const [step, setStep] = useState<'reason' | 'confirm'>('reason')
  const [reason, setReason] = useState<DeletionReason | ''>('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const hasPassword = Boolean(user?.has_password ?? user?.password_hash)

  const handleSendOtp = async () => {
    if (!reason) {
      toast.error('لطفاً دلیل حذف را انتخاب کنید')
      return
    }
    setSendingOtp(true)
    try {
      await requestAccountDeletionOtp(reason)
      setOtpSent(true)
      setStep('confirm')
      toast.success('کد تأیید ارسال شد')
    } catch (err: any) {
      toast.error(err?.message || 'ارسال کد تأیید ناموفق بود')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason || !otp) {
      toast.error('کد تأیید و دلیل حذف الزامی است')
      return
    }
    if (hasPassword && !password) {
      toast.error('رمز عبور الزامی است')
      return
    }
    if (!confirm('آیا از حذف نهایی حساب کاربری اطمینان دارید؟')) {
      return
    }

    setSubmitting(true)
    try {
      const result = await confirmAccountDeletion({ otp, password, reason })
      toast.success(result.message || 'حساب شما برای حذف زمان‌بندی شد')
      await signOut()
      router.push('/auth')
    } catch (err: any) {
      toast.error(err?.message || 'حذف حساب ناموفق بود')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SettingsPageShell title="حذف حساب کاربری">
      {step === 'reason' && (
        <div className="space-y-4">
          <p className="text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark leading-relaxed">
            اگر مطمئن هستید، دلیل حذف را انتخاب کنید. شاید راه بهتری هم وجود داشته باشد.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1.5">دلیل حذف</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as DeletionReason | '')}
              className="input-vista w-full"
            >
              <option value="">انتخاب کنید...</option>
              {DELETION_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {reason && <ReasonRetentionPanel reason={reason} />}
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp || !reason}
            className="btn-vista w-full flex items-center justify-center gap-2 bg-vista-error hover:opacity-90"
          >
            {sendingOtp && <Loader2 className="w-5 h-5 animate-spin" />}
            دریافت کد تأیید
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">دلیل حذف</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as DeletionReason)}
              className="input-vista w-full"
              disabled={otpSent}
            >
              {DELETION_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">کد تأیید (OTP)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input-vista w-full tracking-widest text-center text-lg"
              placeholder="••••••"
              autoComplete="one-time-code"
            />
            {!otpSent && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="text-sm text-vista-primary mt-2 hover:underline"
              >
                {sendingOtp ? 'در حال ارسال...' : 'ارسال مجدد کد'}
              </button>
            )}
          </div>

          {hasPassword && (
            <div>
              <label className="block text-sm font-medium mb-1.5">رمز عبور حساب</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-vista w-full"
                autoComplete="current-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-vista w-full flex items-center justify-center gap-2 bg-vista-error hover:opacity-90"
          >
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
            حذف نهایی حساب
          </button>
        </form>
      )}
    </SettingsPageShell>
  )
}
