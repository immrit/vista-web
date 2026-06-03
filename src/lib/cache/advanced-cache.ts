import { Redis } from '@upstash/redis';

import { env } from '@/lib/env';

export type CacheStrategy = 'memory' | 'redis' | 'both';

export interface CacheOptions {
  ttl?: number;
  strategy?: CacheStrategy;
}

interface MemoryCacheEntry {
  data: unknown;
  expires: number;
}

export class AdvancedCacheSystem {
  private static instance: AdvancedCacheSystem;

  private redis: Redis;

  private memoryCache: Map<string, MemoryCacheEntry> = new Map();

  private maxMemoryItems = 1000;

  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    if (typeof window === 'undefined') {
      this.cleanupTimer = setInterval(() => this.cleanupMemoryCache(), 5 * 60 * 1000);
      this.cleanupTimer.unref?.();
    }
  }

  static getInstance(): AdvancedCacheSystem {
    if (!this.instance) {
      this.instance = new AdvancedCacheSystem();
    }

    return this.instance;
  }

  async get<T>(key: string, strategy: CacheStrategy = 'both'): Promise<T | null> {
    try {
      if (strategy === 'memory' || strategy === 'both') {
        const memoryData = this.getFromMemory<T>(key);
        if (memoryData !== null) {
          return memoryData;
        }
      }

      if (strategy === 'redis' || strategy === 'both') {
        const redisData = await this.redis.get<string>(key);
        if (redisData !== null) {
          const parsed = JSON.parse(redisData) as T;
          if (strategy === 'both') {
            this.setInMemory(key, parsed, 600);
          }
          return parsed;
        }
      }

      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 600, strategy = 'both' } = options;

    try {
      if (strategy === 'memory' || strategy === 'both') {
        this.setInMemory(key, value, ttl);
      }

      if (strategy === 'redis' || strategy === 'both') {
        await this.redis.set(key, JSON.stringify(value), { ex: ttl });
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async invalidate(key: string, strategy: CacheStrategy = 'both'): Promise<void> {
    try {
      if (strategy === 'memory' || strategy === 'both') {
        this.memoryCache.delete(key);
      }

      if (strategy === 'redis' || strategy === 'both') {
        await this.redis.del(key);
      }
    } catch (error) {
      console.error(`Cache invalidate error for key ${key}:`, error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }

      const keys = await this.redis.keys(pattern);
      if (Array.isArray(keys) && keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expires) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setInMemory<T>(key: string, value: T, ttl: number): void {
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + ttl * 1000,
    });
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now > value.expires) {
        this.memoryCache.delete(key);
      }
    }
  }

  getStats() {
    return {
      memoryItems: this.memoryCache.size,
      maxMemoryItems: this.maxMemoryItems,
    };
  }
}

export const cacheSystem = AdvancedCacheSystem.getInstance();








