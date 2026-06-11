import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicPost } from '@/lib/publicPostApi';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const username = req.nextUrl.searchParams.get('username') || req.nextUrl.searchParams.get('u') || undefined;
  const userId = req.nextUrl.searchParams.get('userId') || req.nextUrl.searchParams.get('user') || undefined;

  const post = await fetchPublicPost(id, { username, userId });
  if (!post) {
    return NextResponse.json({ error: 'post_not_found' }, { status: 404 });
  }

  return NextResponse.json(post);
}
