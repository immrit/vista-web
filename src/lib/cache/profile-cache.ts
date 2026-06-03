import { cacheSystem } from '@/lib/cache/advanced-cache';
import { postApi, profileApi } from '@/lib/backendApi';

export interface CachedProfile {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
}

export class ProfileCacheService {
  private static instance: ProfileCacheService;

  private constructor() {}

  static getInstance(): ProfileCacheService {
    if (!this.instance) {
      this.instance = new ProfileCacheService();
    }
    return this.instance;
  }

  async getProfile(userId: string): Promise<CachedProfile | null> {
    const cacheKey = `profile:${userId}`;
    const cached = await cacheSystem.get<CachedProfile>(cacheKey);
    if (cached) return cached;

    try {
      const data = await profileApi.get(userId);
      const profile: CachedProfile = {
        id: data.id,
        username: data.username,
        fullName: data.full_name || null,
        avatarUrl: data.avatar_url || null,
        bio: data.bio || null,
        followersCount: data.followers_count ?? 0,
        followingCount: data.following_count ?? 0,
        postsCount: data.posts_count ?? 0,
        createdAt: data.created_at,
      };

      await cacheSystem.set(cacheKey, profile, { ttl: 600 });
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  async cacheProfileAndPosts(userId: string): Promise<void> {
    try {
      await this.getProfile(userId);
      const posts = await postApi.byUser(userId, 10, 0);
      await cacheSystem.set(`user_posts:${userId}`, posts.posts, { ttl: 300 });
    } catch (error) {
      console.error('Error caching profile and posts:', error);
    }
  }

  async invalidateProfile(userId: string): Promise<void> {
    await cacheSystem.invalidate(`profile:${userId}`);
    await cacheSystem.invalidate(`user_posts:${userId}`);
  }

  async updateProfileCache(userId: string, updates: Partial<CachedProfile>): Promise<void> {
    const cacheKey = `profile:${userId}`;
    const cached = await cacheSystem.get<CachedProfile>(cacheKey);
    if (cached) {
      await cacheSystem.set(cacheKey, { ...cached, ...updates }, { ttl: 600 });
    }
  }
}

export const profileCache = ProfileCacheService.getInstance();
