import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/apiClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  const headers = new Headers();
  const auth = request.headers.get('authorization') || request.cookies.get('access_token')?.value;
  if (auth) {
    headers.set('Authorization', auth.startsWith('Bearer ') ? auth : `Bearer ${auth}`);
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/posts/${encodeURIComponent(id)}`, {
    headers,
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));

  return NextResponse.json(response.ok ? { post: body } : body, { status: response.status });
}
