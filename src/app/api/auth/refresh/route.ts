import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_MAX_AGE = 60 * 60 * 24;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 3650;

function backendBaseUrl() {
  return (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir').replace(/\/+$/, '');
}

async function readBodyRefreshToken(req: NextRequest) {
  try {
    const body = await req.json();
    return typeof body?.refresh_token === 'string' ? body.refresh_token : null;
  } catch {
    return null;
  }
}

import { checkRateLimit, getClientIdentifier, authRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(getClientIdentifier(req), authRateLimit);
  if (!rate.success) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  const refreshToken =
    req.cookies.get('refresh_token')?.value || (await readBodyRefreshToken(req));

  if (!refreshToken) {
    return NextResponse.json(
      { ok: false, error: 'missing_refresh_token' },
      { status: 401 },
    );
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const deviceId = req.headers.get('x-device-id');
  if (deviceId) headers['X-Device-ID'] = deviceId;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${backendBaseUrl()}/v1/auth/refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown refresh error';
    return NextResponse.json(
      { ok: false, error: 'backend_unreachable', message },
      { status: 502 },
    );
  }

  const payload = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    return NextResponse.json(payload || { ok: false, error: 'refresh_failed' }, {
      status: backendResponse.status,
    });
  }

  const accessToken = payload?.session?.access_token;
  const nextRefreshToken = payload?.session?.refresh_token || refreshToken;
  if (typeof accessToken !== 'string' || !accessToken) {
    return NextResponse.json(
      { ok: false, error: 'invalid_refresh_response' },
      { status: 502 },
    );
  }

  const res = NextResponse.json(payload);
  res.cookies.set('access_token', accessToken, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookies.set('refresh_token', nextRefreshToken, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_MAX_AGE,
  });

  return res;
}
