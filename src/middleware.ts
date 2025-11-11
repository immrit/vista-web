import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];
const PUBLIC_PATHS = ['/api/auth', '/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();
  response.headers.set('Content-Language', 'fa');

  const isStaticOrAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.');

  if (isStaticOrAsset) {
    return response;
  }

  if (PROTECTED_METHODS.includes(request.method)) {
    const skipProtection = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (!skipProtection) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');

      if (origin && host) {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          console.warn(`CSRF: Origin mismatch - Origin: ${origin}, Host: ${host}`);
          return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
        }
      }

      const referer = request.headers.get('referer');
      if (!origin && referer && host) {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) {
          console.warn(`CSRF: Referer mismatch - Referer: ${referer}, Host: ${host}`);
          return NextResponse.json({ error: 'Invalid referer' }, { status: 403 });
        }
      }

      if (!origin && !referer) {
        console.warn('CSRF: No Origin or Referer header present');
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
      }
    }
  }

  if (pathname === '/api') {
    return response;
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};