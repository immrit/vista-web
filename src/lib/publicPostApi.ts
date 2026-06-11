import { normalizePost } from '@/lib/backendApi';
import type { PostWithProfile } from '@/lib/types';

function getBackendBaseUrl() {
  return (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir').replace(/\/+$/, '');
}

interface PublicPostHints {
  username?: string;
  userId?: string;
}

async function backendGet<T>(path: string): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  return { ok: true, data: (await response.json()) as T };
}

async function findPostInUserPosts(userId: string, postId: string): Promise<PostWithProfile | null> {
  const result = await backendGet<{ posts?: unknown[] }>(
    `/v1/users/${encodeURIComponent(userId)}/posts?limit=50&offset=0`,
  );
  if (!result.ok) return null;

  const match = (result.data.posts || []).find((post) => {
    const raw = post as { id?: string };
    return raw.id === postId;
  });

  return match ? normalizePost(match as Parameters<typeof normalizePost>[0]) : null;
}

async function findPostInExplore(postId: string): Promise<PostWithProfile | null> {
  let cursor = '';
  for (let page = 0; page < 8; page += 1) {
    const query = cursor
      ? `limit=50&cursor=${encodeURIComponent(cursor)}`
      : 'limit=50&offset=0';
    const result = await backendGet<{ posts?: unknown[]; has_more?: boolean; next_cursor?: string }>(
      `/v1/explore?${query}`,
    );
    if (!result.ok) break;

    const match = (result.data.posts || []).find((post) => {
      const raw = post as { id?: string };
      return raw.id === postId;
    });
    if (match) {
      return normalizePost(match as Parameters<typeof normalizePost>[0]);
    }

    if (!result.data.has_more || !result.data.next_cursor) break;
    cursor = result.data.next_cursor;
  }

  return null;
}

export async function fetchPublicPost(postId: string, hints: PublicPostHints = {}): Promise<PostWithProfile | null> {
  const cleanId = postId.replace(/%5B|%5D/g, '').replace(/\[|\]/g, '').trim();
  if (!cleanId) return null;

  const direct = await backendGet<unknown>(`/v1/posts/${encodeURIComponent(cleanId)}`);
  if (direct.ok) {
    return normalizePost(direct.data as Parameters<typeof normalizePost>[0]);
  }

  if (hints.userId) {
    const fromUser = await findPostInUserPosts(hints.userId, cleanId);
    if (fromUser) return fromUser;
  }

  if (hints.username) {
    const profileResult = await backendGet<{ user_id?: string }>(
      `/v1/profiles/by-username/${encodeURIComponent(hints.username)}`,
    );
    if (profileResult.ok && profileResult.data.user_id) {
      const fromUser = await findPostInUserPosts(profileResult.data.user_id, cleanId);
      if (fromUser) return fromUser;
    }
  }

  return findPostInExplore(cleanId);
}
