/**
 * /api/auth/token
 *
 * Server-side route that sets/clears auth tokens in HttpOnly cookies.
 * This is the ONLY place tokens touch storage – never localStorage.
 *
 * POST  { access_token, refresh_token? }  → set HttpOnly cookies
 * DELETE                                  → clear cookies (logout)
 */

import { NextRequest, NextResponse } from 'next/server';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_MAX_AGE = 60 * 60 * 24;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 3650;

function isLikelyJwt(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  return parts.every(part => part.length > 0 && part.length <= 2048) && token.length <= 8192;
}

export async function POST(req: NextRequest) {
  let body: { access_token?: string; refresh_token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const { access_token, refresh_token } = body;
  if (!access_token || typeof access_token !== 'string' || !isLikelyJwt(access_token)) {
    return NextResponse.json({ ok: false, error: 'invalid_access_token' }, { status: 400 });
  }

  if (refresh_token !== undefined && (typeof refresh_token !== 'string' || refresh_token.length > 512)) {
    return NextResponse.json({ ok: false, error: 'invalid_refresh_token' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set('access_token', access_token, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_MAX_AGE,
  });

  if (refresh_token && typeof refresh_token === 'string') {
    res.cookies.set('refresh_token', refresh_token, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_MAX_AGE,
    });
  }

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set('access_token', '', { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set('refresh_token', '', { ...COOKIE_OPTS, maxAge: 0 });

  return res;
}
