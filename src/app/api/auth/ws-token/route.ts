/**
 * Short-lived WebSocket auth bridge.
 * Token is passed via Sec-WebSocket-Protocol (not URL) to avoid log leakage.
 */
import { NextRequest, NextResponse } from 'next/server';

import { checkRateLimit, getClientIdentifier, apiRateLimit } from '@/lib/rate-limit';
import { memoryRateLimit } from '@/lib/security/rateLimitFallback';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = getClientIdentifier(req);
  if (!memoryRateLimit(key)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const rate = await checkRateLimit(key, apiRateLimit);
  if (rate.limit > 0 && !rate.success) {
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
