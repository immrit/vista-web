import { apiClient } from './apiClient';
import type { CommentWithProfile, PostWithProfile, Profile } from './types';

type Nullable<T> = T | null | undefined;

interface BackendAuthor {
  user_id: string;
  username?: Nullable<string>;
  full_name?: Nullable<string>;
  avatar_url?: Nullable<string>;
  is_verified?: boolean;
  verification_type?: Nullable<string>;
}

interface BackendProfile {
  id?: string;
  user_id?: string;
  username?: Nullable<string>;
  full_name?: Nullable<string>;
  email?: Nullable<string>;
  bio?: Nullable<string>;
  avatar_url?: Nullable<string>;
  role?: Nullable<string>;
  verification_type?: Nullable<string>;
  is_verified?: boolean;
  subscription_plan?: Nullable<string>;
  subscription_expires_at?: Nullable<string>;
  is_private?: boolean;
  post_count?: number;
  posts_count?: number;
  follower_count?: number;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface BackendPost {
  id: string;
  user_id: string;
  content?: Nullable<string>;
  image_url?: Nullable<string>;
  video_url?: Nullable<string>;
  music_url?: Nullable<string>;
  like_count?: number;
  likes_count?: number;
  comment_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  created_at: string;
  updated_at?: string;
  author?: BackendAuthor;
  profiles?: BackendProfile;
  [key: string]: unknown;
}

interface BackendComment {
  id: string;
  post_id: string;
  user_id: string;
  owner_id?: string;
  content: string;
  parent_comment_id?: Nullable<string>;
  profiles?: BackendProfile;
  created_at: string;
  updated_at?: string;
}

function asIsoString(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

export function normalizeProfile(raw: Nullable<BackendProfile | BackendAuthor>): Profile {
  const profile = (raw || {}) as BackendProfile & BackendAuthor;
  const id = profile.id || profile.user_id || '';
  const username = profile.username || '';
  const fullName = profile.full_name || username || 'کاربر ویستا';

  return {
    ...profile,
    id,
    user_id: id,
    username,
    full_name: fullName,
    avatar_url: profile.avatar_url || undefined,
    bio: (profile as BackendProfile).bio || undefined,
    email: (profile as BackendProfile).email || undefined,
    created_at: asIsoString((profile as BackendProfile).created_at),
    updated_at: asIsoString((profile as BackendProfile).updated_at),
    is_verified: Boolean(profile.is_verified),
    verification_type: profile.verification_type || undefined,
    role: (profile as BackendProfile).role || undefined,
    subscription_plan: (profile as BackendProfile).subscription_plan || undefined,
    subscription_expires_at: (profile as BackendProfile).subscription_expires_at || undefined,
    posts_count: (profile as BackendProfile).posts_count ?? (profile as BackendProfile).post_count ?? 0,
    followers_count: (profile as BackendProfile).followers_count ?? (profile as BackendProfile).follower_count ?? 0,
    following_count: (profile as BackendProfile).following_count ?? 0,
    is_private: Boolean((profile as BackendProfile).is_private),
  };
}

export function normalizePost(raw: BackendPost): PostWithProfile {
  const authorProfile = normalizeProfile(raw.profiles || raw.author || { user_id: raw.user_id });

  return {
    ...raw,
    id: raw.id,
    user_id: raw.user_id,
    content: raw.content || '',
    image_url: raw.image_url || null,
    video_url: raw.video_url || null,
    music_url: raw.music_url || null,
    created_at: asIsoString(raw.created_at),
    updated_at: asIsoString(raw.updated_at || raw.created_at),
    profiles: authorProfile,
    likes_count: raw.likes_count ?? raw.like_count ?? 0,
    comments_count: raw.comments_count ?? raw.comment_count ?? 0,
    is_liked: Boolean(raw.is_liked),
    is_saved: Boolean(raw.is_saved),
  };
}

export function normalizeComment(raw: BackendComment): CommentWithProfile {
  return {
    id: raw.id,
    post_id: raw.post_id,
    user_id: raw.user_id,
    content: raw.content,
    created_at: asIsoString(raw.created_at),
    profiles: normalizeProfile(raw.profiles || { user_id: raw.user_id }),
    parent_comment_id: raw.parent_comment_id || null,
    replies: [],
  };
}

export function getPostCharacterLimit(profile?: Nullable<Profile>) {
  const verificationType = String(profile?.verification_type || '').toLowerCase().replace(/[\s_.-]/g, '');
  const role = String(profile?.role || '').toLowerCase();
  const subscriptionExpiresAt = profile?.subscription_expires_at ? Date.parse(profile.subscription_expires_at) : 0;
  const hasActiveSubscription = Number.isFinite(subscriptionExpiresAt) && subscriptionExpiresAt > Date.now();

  if (verificationType === 'bluetick' || verificationType === 'blue') return 2000;
  if (
    verificationType === 'goldtick' ||
    verificationType === 'gold' ||
    verificationType === 'blacktick' ||
    verificationType === 'black' ||
    role === 'premium' ||
    hasActiveSubscription
  ) {
    return 400;
  }
  return 200;
}

export const profileApi = {
  async get(userId: string) {
    const data = await apiClient.get<BackendProfile>(`/v1/profiles/${encodeURIComponent(userId)}`);
    return normalizeProfile(data);
  },

  async getMe() {
    const data = await apiClient.get<BackendProfile>('/v1/me/profile');
    return normalizeProfile(data);
  },

  async update(updates: Partial<Profile>) {
    const data = await apiClient.post<BackendProfile>('/v1/me/profile/update', updates);
    return normalizeProfile(data);
  },

  async byUsername(username: string) {
    const data = await apiClient.get<BackendProfile>(`/v1/profiles/by-username/${encodeURIComponent(username)}`);
    return normalizeProfile(data);
  },

  async search(query: string, limit = 20) {
    const data = await apiClient.get<{ profiles?: BackendProfile[] }>(
      `/v1/profiles/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return (data.profiles || []).map(normalizeProfile);
  },

  async getPrivacySettings() {
    const data = await apiClient.get<any>('/v1/me/privacy');
    return data;
  },
  async updatePrivacySettings(settings: any) {
    const data = await apiClient.post<any>('/v1/me/privacy', settings);
    return data;
  },
  async getUserSettings() {
    const data = await apiClient.get<any>('/v1/me/settings');
    return data;
  },
  async updateUserSettings(settings: any) {
    const data = await apiClient.post<any>('/v1/me/settings', settings);
    return data;
  },
  async getNotificationSettings() {
    const data = await apiClient.get<any>('/v1/me/notification-settings');
    return data;
  },
  async updateNotificationSettings(settings: any) {
    const data = await apiClient.post<any>('/v1/me/notification-settings', settings);
    return data;
  },
};

export const postApi = {
  async feed(limit = 10, offset = 0) {
    const data = await apiClient.get<{ posts?: BackendPost[]; has_more?: boolean; next_cursor?: string }>(
      `/v1/feed?limit=${limit}&offset=${offset}`,
    );
    return {
      posts: (data.posts || []).map(normalizePost),
      hasMore: Boolean(data.has_more),
      nextCursor: data.next_cursor,
    };
  },

  async explore(limit = 20, cursor?: string) {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    if (cursor) {
      queryParams.append('cursor', cursor);
    } else {
      queryParams.append('offset', '0');
    }
    const data = await apiClient.get<{ posts?: BackendPost[]; has_more?: boolean; next_cursor?: string }>(
      `/v1/explore?${queryParams.toString()}`,
    );
    return {
      posts: (data.posts || []).map(normalizePost),
      hasMore: Boolean(data.has_more),
      nextCursor: data.next_cursor,
    };
  },

  async following(limit = 20, cursor?: string) {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    if (cursor) queryParams.append('cursor', cursor);
    const data = await apiClient.get<{ posts?: BackendPost[]; has_more?: boolean; next_cursor?: string }>(
      `/v1/feed/following?${queryParams.toString()}`,
    );
    return {
      posts: (data.posts || []).map(normalizePost),
      hasMore: Boolean(data.has_more),
      nextCursor: data.next_cursor,
    };
  },

  async get(postId: string) {
    const data = await apiClient.get<BackendPost>(`/v1/posts/${encodeURIComponent(postId)}`);
    return normalizePost(data);
  },

  async create(input: {
    content?: string;
    image_url?: string;
    video_url?: string;
    music_url?: string;
    tags?: string[];
  }) {
    const data = await apiClient.post<BackendPost>('/v1/posts', input);
    return normalizePost(data);
  },

  async update(postId: string, content: string) {
    const data = await apiClient.patch<BackendPost>(`/v1/posts/${encodeURIComponent(postId)}`, { content });
    return normalizePost(data);
  },

  async delete(postId: string) {
    await apiClient.delete(`/v1/posts/${encodeURIComponent(postId)}`);
  },

  async toggleLike(postId: string, ownerId?: string) {
    return apiClient.post<{ is_liked: boolean; like_count: number }>(
      `/v1/posts/like/${encodeURIComponent(postId)}`,
      { owner_id: ownerId || '' },
    );
  },

  async report(postId: string, reportedUserId: string, reason = 'inappropriate') {
    await apiClient.post('/v1/posts/report', {
      post_id: postId,
      reported_user_id: reportedUserId,
      reason,
    });
  },

  async byUser(userId: string, limit = 30, offset = 0) {
    const data = await apiClient.get<{ posts?: BackendPost[]; has_more?: boolean }>(
      `/v1/users/${encodeURIComponent(userId)}/posts?limit=${limit}&offset=${offset}`,
    );
    return {
      posts: (data.posts || []).map(normalizePost),
      hasMore: Boolean(data.has_more),
    };
  },

  async byHashtag(tag: string, limit = 20) {
    const cleanTag = tag.replace(/^#/, '');
    const data = await apiClient.get<{ posts?: BackendPost[] }>(
      `/v1/posts/hashtag/${encodeURIComponent(cleanTag)}?limit=${limit}`,
    );
    return (data.posts || []).map(normalizePost);
  },

  async trendingHashtags(limit = 20) {
    const data = await apiClient.get<{ hashtags?: { tag: string; usage_count?: number; count?: number }[] }>(
      `/v1/hashtags/trending?limit=${limit}`,
    );
    return (data.hashtags || []).map(item => ({ tag: item.tag, count: item.count ?? item.usage_count ?? 0 }));
  },

  async searchHashtags(query: string, limit = 20) {
    const data = await apiClient.get<{ hashtags?: { tag: string; usage_count?: number; count?: number }[] }>(
      `/v1/hashtags/search?q=${encodeURIComponent(query.replace(/^#/, ''))}&limit=${limit}`,
    );
    return (data.hashtags || []).map(item => ({ tag: item.tag, count: item.count ?? item.usage_count ?? 0 }));
  },

  async feedEvent(postId: string, eventType: string = 'view') {
    await apiClient.post('/v1/feed/event', {
      post_id: postId,
      event_type: eventType,
    });
  },
};

export const commentApi = {
  async list(postId: string) {
    const data = await apiClient.get<{ comments?: BackendComment[] }>(
      `/v1/comments?post_id=${encodeURIComponent(postId)}&limit=100`,
    );
    const comments = (data.comments || []).map(normalizeComment);
    const byParent = new Map<string, CommentWithProfile[]>();
    const roots: CommentWithProfile[] = [];

    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const replies = byParent.get(comment.parent_comment_id) || [];
        replies.push(comment);
        byParent.set(comment.parent_comment_id, replies);
      } else {
        roots.push(comment);
      }
    });

    return roots.map(comment => ({
      ...comment,
      replies: (byParent.get(comment.id) || []).reverse(),
    }));
  },

  async create(postId: string, content: string, parentCommentId?: string) {
    const data = await apiClient.post<BackendComment>('/v1/comments', {
      post_id: postId,
      content,
      parent_comment_id: parentCommentId,
    });
    return normalizeComment(data);
  },

  async count(postId: string) {
    const data = await apiClient.get<{ count?: number }>(
      `/v1/comments?post_id=${encodeURIComponent(postId)}&count=true`,
    );
    return data.count || 0;
  },
};
