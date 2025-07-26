export const defaultLocale = 'fa'
export const locales = ['fa'] as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
    fa: 'فارسی',
}

export function getLocale(pathname: string): Locale {
    const segments = pathname.split('/')
    const locale = segments[1] as Locale

    if (locales.includes(locale)) {
        return locale
    }

    return defaultLocale
}

export function createLocalizedPathname(
    pathname: string,
    locale: Locale
): string {
    if (locale === defaultLocale) {
        return pathname
    }

    return `/${locale}${pathname}`
} 