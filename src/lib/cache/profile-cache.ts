import { cacheSystem } from '@/lib/cache/advanced-cache';
import { createClient } from '@/lib/supabase/server';

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
    if (cached) {
      return cached;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          bio,
          created_at,
          followers_count,
          following_count,
          posts_count
        `)
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      const profile: CachedProfile = {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        bio: data.bio,
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

      const supabase = createClient();
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (posts) {
        const cacheKey = `user_posts:${userId}`;
        await cacheSystem.set(cacheKey, posts, { ttl: 300 });
      }
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
      const updated = { ...cached, ...updates };
      await cacheSystem.set(cacheKey, updated, { ttl: 600 });
    }
  }
}

export const profileCache = ProfileCacheService.getInstance();


