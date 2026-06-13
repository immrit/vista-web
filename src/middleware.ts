import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route classification ─────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  '/auth',
  '/group',
];

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

function isPublicSharePath(pathname: string) {
  return /^\/post\/[^/]+/.test(pathname) || /^\/profile\/[^/]+/.test(pathname);
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
  return isPublicSharePath(pathname);
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

// ─── Auth guard ───────────────────────────────────────────────────────────────

function requiresAuth(pathname: string): boolean {
  // Don't guard static assets, public paths, or API routes (they self-authenticate)
  if (isStaticAsset(pathname)) return false;
  if (isPublicPath(pathname)) return false;
  if (pathname.startsWith('/api/')) return false;
  return true;
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

  // Auth guard: redirect unauthenticated users to /auth
  if (requiresAuth(pathname)) {
    const token = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (!token && !refreshToken) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('next', pathname);
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
