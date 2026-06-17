import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';
import { env } from '@/lib/env';

// Server-side API fetch helper that automatically includes cookies
const fetchApi = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir'}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
};

// Get current authenticated user
export const getCurrentUser = cache(async () => {
  try {
    // /v1/auth/me returns the user profile from the custom backend
    const user = await fetchApi<any>('/v1/auth/me');
    return user;
  } catch (error) {
    return null;
  }
});

// Get current user's profile
export const getCurrentProfile = cache(async () => {
  return await getCurrentUser();
});

// Verify user is authenticated (throws if not)
export const verifyAuth = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('کاربر احراز هویت نشده است.');
  }

  return user;
});
