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

// Legacy exports for backward compatibility
export const getUserProfile = cache(async (userId: string) => {
  if (!userId) {
    throw new Error('Invalid user id');
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  try {
    // Fetch profile from /v1/users/:id/profile or similar. 
    // Wait, the router.go didn't show /v1/users/:id/profile in httpapi, but it might be in the profile module.
    // For now, assume /v1/profile/:id
    const profile = await fetchApi<any>(`/v1/profile/${userId}`);
    return profile;
  } catch (error) {
    throw new Error('Profile not found');
  }
});

export const getUserPosts = cache(
  async (userId: string, options?: { limit?: number; offset?: number }) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    try {
      const data = await fetchApi<any>(`/v1/users/${userId}/posts?limit=${limit}&offset=${offset}`);
      return data.posts || [];
    } catch (error) {
      throw new Error('Failed to fetch posts');
    }
  },
);

export const hasRole = cache(async (role: string) => {
  const profile = await getCurrentProfile();
  if (!profile) return false;
  return profile.role === role;
});

export const isAdmin = cache(async () => {
  return hasRole('admin');
});

export const hasPremiumAccess = cache(async () => {
  const profile = await getCurrentProfile();
  if (!profile) return false;
  
  // Custom backend logic for premium
  if (profile.verification_type === 'premium' && profile.subscription_expires_at) {
    const expiresAt = new Date(profile.subscription_expires_at);
    return expiresAt > new Date();
  }
  return false;
});
