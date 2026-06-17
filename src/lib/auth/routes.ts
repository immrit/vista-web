export const PUBLIC_PATH_PREFIXES = ['/auth', '/group'] as const

export function isPublicSharePath(pathname: string) {
  return /^\/post\/[^/]+/.test(pathname) || /^\/profile\/[^/]+/.test(pathname)
}

export function isPublicPath(pathname: string) {
  if (PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return true
  return isPublicSharePath(pathname)
}

export function isOnboardingPath(pathname: string) {
  return (
    pathname === '/set-password' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/profile-setup')
  )
}

export function buildAuthNextPath(pathname: string, search = '') {
  return `${pathname}${search}`
}

export function requiresAuth(pathname: string) {
  if (pathname.startsWith('/api/')) return false
  if (isPublicPath(pathname)) return false
  return true
}

export function shouldHideAppShell(pathname: string, isAuthenticated: boolean) {
  return (
    pathname.startsWith('/auth') ||
    pathname === '/set-password' ||
    pathname.startsWith('/profile-setup') ||
    (isPublicSharePath(pathname) && !isAuthenticated)
  )
}

export function shouldHideMobileNav(pathname: string, isAuthenticated: boolean) {
  return (
    pathname.startsWith('/messages') ||
    pathname.startsWith('/game') ||
    (isPublicSharePath(pathname) && !isAuthenticated)
  )
}
