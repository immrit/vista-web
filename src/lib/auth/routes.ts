export const PUBLIC_PATH_PREFIXES = ['/auth', '/group'] as const

export function isPublicSharePath(pathname: string) {
  return /^\/post\/[^/]+/.test(pathname) || /^\/profile\/[^/]+/.test(pathname)
}

export function isPublicPath(pathname: string) {
  if (PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return true
  // /game/sso is a one-time SSO landing that bootstraps the game session cookie.
  // It must be reachable before any session exists.
  if (pathname === '/game/sso') return true
  return isPublicSharePath(pathname)
}

/** True when the pathname is inside the game section (including the SSO landing). */
export function isGamePath(pathname: string) {
  return pathname === '/game' || pathname.startsWith('/game/')
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
    pathname.startsWith('/game') ||
    pathname.startsWith('/reels') ||
    (isPublicSharePath(pathname) && !isAuthenticated)
  )
}

export function shouldHideMobileNav(pathname: string, isAuthenticated: boolean) {
  return (
    pathname.startsWith('/messages') ||
    pathname.startsWith('/game') ||
    pathname.startsWith('/reels') ||
    (isPublicSharePath(pathname) && !isAuthenticated)
  )
}
