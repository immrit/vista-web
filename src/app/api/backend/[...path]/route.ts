import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

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
])

function copyRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers()
  const contentType = req.headers.get('content-type')
  const realIp = req.headers.get('x-real-ip')
  const forwardedFor = req.headers.get('x-forwarded-for')
  const deviceId = req.headers.get('x-device-id')

  if (contentType) headers.set('content-type', contentType)
  if (realIp) headers.set('x-real-ip', realIp)
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor)
  if (deviceId) headers.set('x-device-id', deviceId)
  
  // BFF Pattern: Read the HttpOnly cookie and securely convert it to a Bearer token
  // for the Go backend. This ensures the client never touches the token directly.
  const token = req.cookies.get('access_token')?.value
  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  return headers
}

function copyResponseHeaders(res: Response): Headers {
  const headers = new Headers()
  res.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })
  return headers
}

async function proxyBackend(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir'
  const target = new URL(`/${path.map(encodeURIComponent).join('/')}`, backendUrl)
  target.search = req.nextUrl.search

  try {
    const init: RequestInit = {
      method: req.method,
      headers: copyRequestHeaders(req),
      redirect: 'manual',
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = await req.arrayBuffer()
    }

    const res = await fetch(target, init)
    return new Response(await res.arrayBuffer(), {
      status: res.status,
      statusText: res.statusText,
      headers: copyResponseHeaders(res),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown proxy error'
    return Response.json(
      {
        ok: false,
        error: 'backend_unreachable',
        message,
        target: target.origin,
      },
      { status: 502 }
    )
  }
}

export const GET = proxyBackend
export const POST = proxyBackend
export const PATCH = proxyBackend
export const DELETE = proxyBackend
export const PUT = proxyBackend
export const OPTIONS = proxyBackend
