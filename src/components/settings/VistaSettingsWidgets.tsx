'use client'

import Link from 'next/link'
import { ChevronLeft, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/theme/cn'

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-vista-text-secondary dark:text-vista-text-secondary-dark uppercase tracking-wide px-1 mb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function SettingsGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-vista-surface dark:bg-vista-surface-dark rounded-2xl border border-vista-border dark:border-vista-border-dark overflow-hidden divide-y divide-vista-border dark:divide-vista-border-dark',
      className
    )}>
      {children}
    </div>
  )
}

interface SettingsTileProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  href?: string
  onClick?: () => void
  trailing?: React.ReactNode
  iconColor?: string
  titleColor?: string
  destructive?: boolean
  showArrow?: boolean
}

export function SettingsTile({
  icon: Icon,
  title,
  subtitle,
  href,
  onClick,
  trailing,
  iconColor,
  titleColor,
  destructive,
  showArrow = true,
}: SettingsTileProps) {
  const content = (
    <>
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        destructive ? 'bg-vista-error/10' : 'bg-vista-primary/10'
      )}>
        <Icon className={cn('w-5 h-5', iconColor || (destructive ? 'text-vista-error' : 'text-vista-primary'))} />
      </div>
      <div className="flex-1 min-w-0 text-right">
        <p className={cn('text-[15px] font-medium', titleColor || (destructive ? 'text-vista-error' : ''))}>{title}</p>
        {subtitle && (
          <p className="text-[13px] text-vista-text-secondary dark:text-vista-text-secondary-dark truncate">{subtitle}</p>
        )}
      </div>
      {trailing ?? (showArrow && href ? (
        <ChevronLeft className="w-5 h-5 text-vista-text-secondary dark:text-vista-text-secondary-dark shrink-0 rotate-180" />
      ) : null)}
    </>
  )

  const className = 'flex items-center gap-3 px-4 py-3.5 hover:bg-vista-surface-variant/50 dark:hover:bg-vista-surface-variant-dark/50 transition-colors w-full text-right'

  if (href) {
    return <Link href={href} className={className}>{content}</Link>
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}

export function SettingsSwitch({
  icon: Icon,
  title,
  subtitle,
  checked,
  onChange,
  disabled,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <SettingsTile
      icon={Icon}
      title={title}
      subtitle={subtitle}
      showArrow={false}
      trailing={
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors shrink-0',
            checked ? 'bg-vista-primary' : 'bg-vista-border dark:bg-vista-border-dark',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            checked ? 'right-0.5' : 'right-[22px]'
          )} />
        </button>
      }
    />
  )
}

export function SettingsChoice<T extends string>({
  icon: Icon,
  title,
  value,
  options,
  onChange,
}: {
  icon: LucideIcon
  title: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const current = options.find(o => o.value === value)?.label || value

  return (
    <SettingsTile
      icon={Icon}
      title={title}
      subtitle={current}
      onClick={() => {
        const idx = options.findIndex(o => o.value === value)
        const next = options[(idx + 1) % options.length]
        onChange(next.value)
      }}
    />
  )
}

export function SettingsPageShell({
  title,
  children,
  backHref = '/settings',
}: {
  title: string
  children: React.ReactNode
  backHref?: string
}) {
  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-vista-bg/90 dark:bg-vista-bg-dark/90 backdrop-blur-xl border-b border-vista-border/50 dark:border-vista-border-dark/50 lg:hidden">
        <Link href={backHref} className="p-2 -mr-2 rounded-full hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark">
          <ChevronLeft className="w-6 h-6 rotate-180" />
        </Link>
        <h1 className="font-bold text-lg">{title}</h1>
      </header>

      <div className="feed-container lg:pt-8 px-4 py-4 max-w-2xl">
        <h1 className="hidden lg:block text-2xl font-bold mb-6">{title}</h1>
        {children}
      </div>
    </div>
  )
}
