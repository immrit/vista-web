/**
 * Short-lived WebSocket auth bridge.
 * Token is passed via Sec-WebSocket-Protocol (not URL) to avoid log leakage.
 */
import { NextRequest, NextResponse } from 'next/server';

import { memoryRateLimit } from '@/lib/security/rateLimitFallback';

export const dynamic = 'force-dynamic';

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';
  return ip || `ua:${req.headers.get('user-agent') || 'unknown'}`;
}

export async function GET(req: NextRequest) {
  if (!memoryRateLimit(clientKey(req))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { token, expires_in: 3600 },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
