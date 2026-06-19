/**
 * /api/game/sso
 *
 * Server-side BFF endpoint for the native-app → webview game handoff.
 *
 * POST { ticket } →
 *   - exchanges the one-time ticket with the backend for a *scoped* game token
 *     (scope="game", usable only on /game and the backend's /v1/game/* APIs)
 *   - stores it in an HttpOnly `game_token` cookie (never localStorage)
 *
 * This intentionally does NOT set `access_token`: a webview that came in via
 * this route gets a game-only session and nothing more. The middleware confines
 * a game_token-only session to /game/*, and the backend rejects the scoped token
 * on every non-game path.
 */

import { NextRequest, NextResponse } from 'next/server';

import { checkRateLimit, getClientIdentifier, apiRateLimit } from '@/lib/rate-limit';

function getCookieOpts(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol;
  const isLocal = req.headers.get('host')?.includes('localhost') || req.headers.get('host')?.includes('10.0.2.2') || req.headers.get('host')?.startsWith('192.168.');
  return {
    httpOnly: true,
    secure: proto.includes('https') || (process.env.NODE_ENV === 'production' && !isLocal),
    sameSite: 'lax' as const,
    path: '/',
  };
}

// Keep in sync with backend AUTH_GAME_SSO_TTL (default 24h). The backend JWT
// exp is authoritative; this only bounds the cookie.
const GAME_TOKEN_MAX_AGE = 60 * 60 * 24;

function backendBase(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.coffevista.ir'
  ).replace(/\/+$/, '');
}

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(getClientIdentifier(req), apiRateLimit);
  if (!rate.success) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: { ticket?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const ticket = typeof body.ticket === 'string' ? body.ticket.trim() : '';
  if (!ticket || ticket.length > 128) {
    return NextResponse.json({ ok: false, error: 'invalid_ticket' }, { status: 400 });
  }

  let exchange: Response;
  try {
    exchange = await fetch(`${backendBase()}/v1/game-sso/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ticket }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'backend_unreachable' }, { status: 502 });
  }

  if (!exchange.ok) {
    return NextResponse.json({ ok: false, error: 'invalid_or_expired_ticket' }, { status: 401 });
  }

  let data: { game_token?: string; user_id?: string };
  try {
    data = await exchange.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_backend_response' }, { status: 502 });
  }

  const gameToken = typeof data.game_token === 'string' ? data.game_token : '';
  if (!gameToken) {
    return NextResponse.json({ ok: false, error: 'no_token' }, { status: 502 });
  }

  const res = NextResponse.json({ ok: true, userId: data.user_id ?? null });
  res.cookies.set('game_token', gameToken, {
    ...getCookieOpts(req),
    maxAge: GAME_TOKEN_MAX_AGE,
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('game_token', '', { ...getCookieOpts(req), maxAge: 0 });
  return res;
}
