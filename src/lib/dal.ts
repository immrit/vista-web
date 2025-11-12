import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { env } from '@/lib/env';

async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              console.error('Failed to set cookie', name, error);
            }
          });
        },
      },
    },
  );
}

export const getCurrentUser = cache(async () => {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at != null,
      createdAt: user.created_at,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
});

export async function verifyAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export const getUserProfile = cache(async (userId: string) => {
  if (!userId) {
    throw new Error('Invalid user id');
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Profile not found');
  }

  return data;
});

export const getUserPosts = cache(
  async (userId: string, options?: { limit?: number; offset?: number }) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const { limit = 20, offset = 0 } = options || {};

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at, likes_count, comments_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error('Failed to fetch posts');
    }

    return data;
  },
);


