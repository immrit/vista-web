import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requiresAuth } from '@/lib/auth/routes';

const STATIC_PREFIXES = ['/_next', '/static', '/favicon', '/icons', '/images', '/public'];
const API_CSRF_EXEMPT = new Set([
  '/api/auth/refresh',
]);

function isCsrfExempt(pathname: string): boolean {
  return API_CSRF_EXEMPT.has(pathname);
}

function isStaticAsset(pathname: string) {
  return (
    STATIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.includes('.')
  );
}

// ─── Security Headers ─────────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  // Stop MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  // Force HTTPS for 1 year (preload)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Minimal referrer info cross-origin
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Prevent XSS in older browsers
  'X-XSS-Protection': '1; mode=block',
  // Disable dangerous browser features
  'Permissions-Policy':
    'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), bluetooth=()',
  // Prevent the browser window from being opened in a cross-origin context
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  // Restrict embedded resources
  'Cross-Origin-Resource-Policy': 'same-site',
  // Content-Security-Policy — strict; adjust as needed for external CDNs
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Next.js requires unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.coffevista.ir wss://api.coffevista.ir http://localhost:8080 ws://localhost:8080 http://127.0.0.1:8080 ws://127.0.0.1:8080",
    "media-src 'self' https://storage.coffevista.ir https://storage.389346.ir.cdn.ir blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Content-Language': 'fa',
};

function applySecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ─── CSRF protection ──────────────────────────────────────────────────────────

const MUTATION_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

function csrfCheck(request: NextRequest): NextResponse | null {
  if (!MUTATION_METHODS.has(request.method)) return null;

  // Skip CSRF for paths that are explicitly public auth routes
  if (isCsrfExempt(request.nextUrl.pathname)) return null;

  const origin  = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host    = request.headers.get('host');

  if (!host) return null; // can't validate without host

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: 'CSRF: invalid origin' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'CSRF: malformed origin' }, { status: 403 });
    }
  } else if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        return NextResponse.json({ error: 'CSRF: invalid referer' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'CSRF: malformed referer' }, { status: 403 });
    }
  } else {
    // No Origin and no Referer — block by default for non-public mutations
    return NextResponse.json({ error: 'CSRF: missing origin/referer' }, { status: 403 });
  }

  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets — just pass through quickly
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Redirect bare root → /feed
  if (pathname === '/') {
    const res = NextResponse.redirect(new URL('/feed', request.url));
    return applySecurityHeaders(res);
  }

  let res = NextResponse.next();

  // CSRF check
  const csrfError = csrfCheck(request);
  if (csrfError) return csrfError;

  // The game-SSO landing exchanges a one-time ticket; it must be reachable
  // before any session cookie exists.
  if (pathname === '/game/sso') {
    return applySecurityHeaders(res);
  }

  // Auth guard.
  //
  // Two session kinds:
  //   • full session  — access_token / refresh_token (native web users)
  //   • game session  — game_token only, minted via the native-app handoff,
  //                      confined to /game/* (the webview must not reach the
  //                      rest of the app even if a link tries to navigate away).
  if (requiresAuth(pathname)) {
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const gameToken = request.cookies.get('game_token')?.value;

    const hasFullSession = Boolean(accessToken || refreshToken);
    const isGamePath = pathname === '/game' || pathname.startsWith('/game/');

    // A game-only session is valid *only* inside /game. Anywhere else it counts
    // as unauthenticated, so the webview can never view feed/messages/etc.
    const authorized = isGamePath
      ? hasFullSession || Boolean(gameToken)
      : hasFullSession;

    if (!authorized) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set(
        'next',
        `${pathname}${request.nextUrl.search}`,
      );
      const redirectRes = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirectRes);
    }
  }

  return applySecurityHeaders(res);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
