import { NextRequest, NextResponse } from 'next/server';

import { sanitizeUuid } from '@/lib/validation/sanitize';

export const dynamic = 'force-dynamic';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const UUID_PATH_MARKERS = new Set(['conversations', 'messages', 'profiles', 'users']);

function validateProxyPath(path: string[]): string | null {
  for (let i = 0; i < path.length; i++) {
    const marker = path[i - 1];
    const segment = decodeURIComponent(path[i] || '');
    if (marker && UUID_PATH_MARKERS.has(marker) && segment.length >= 32) {
      if (!sanitizeUuid(segment)) {
        return `invalid_id:${segment.slice(0, 8)}`;
      }
    }
  }
  return null;
}

function copyRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  const realIp = req.headers.get('x-real-ip');
  const forwardedFor = req.headers.get('x-forwarded-for');
  const deviceId = req.headers.get('x-device-id');

  if (contentType) headers.set('content-type', contentType);
  if (realIp) headers.set('x-real-ip', realIp);
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  if (deviceId) headers.set('x-device-id', deviceId);

  // Full session takes precedence; otherwise a scoped game session (webview
  // handoff) forwards its game_token. The backend confines the scoped token to
  // /v1/game/* regardless of what path is proxied here.
  const token =
    req.cookies.get('access_token')?.value || req.cookies.get('game_token')?.value;
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return headers;
}

function copyResponseHeaders(res: Response): Headers {
  const headers = new Headers();
  res.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

async function proxyBackend(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await params;
  const pathError = validateProxyPath(path);
  if (pathError) {
    return NextResponse.json({ error: 'invalid_request', code: 'INVALID_ID' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir';
  const target = new URL(`/${path.map(encodeURIComponent).join('/')}`, backendUrl);
  target.search = req.nextUrl.search;

  try {
    const init: RequestInit = {
      method: req.method,
      headers: copyRequestHeaders(req),
      redirect: 'manual',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = await req.arrayBuffer();
    }

    const res = await fetch(target, init);
    return new Response(await res.arrayBuffer(), {
      status: res.status,
      statusText: res.statusText,
      headers: copyResponseHeaders(res),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown proxy error';
    return Response.json(
      {
        ok: false,
        error: 'backend_unreachable',
        message,
      },
      { status: 502 },
    );
  }
}

export const GET = proxyBackend;
export const POST = proxyBackend;
export const PATCH = proxyBackend;
export const DELETE = proxyBackend;
export const PUT = proxyBackend;
export const OPTIONS = proxyBackend;
