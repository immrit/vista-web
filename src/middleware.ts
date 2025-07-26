import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Set RTL headers
    const response = NextResponse.next()
    response.headers.set('Content-Language', 'fa')

    // اگر کاربر به root path می‌رود، اجازه بده تا client-side routing کار کند
    if (pathname === '/') {
        return response
    }

    // اگر کاربر به auth page می‌رود و قبلاً لاگین کرده، redirect به feed
    if (pathname === '/auth') {
        // این کار را در client-side انجام می‌دهیم
        return response
    }

    // اگر کاربر به feed می‌رود و لاگین نکرده، redirect به auth
    if (pathname === '/feed') {
        // این کار را در client-side انجام می‌دهیم
        return response
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
} 