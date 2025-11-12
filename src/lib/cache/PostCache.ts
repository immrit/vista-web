interface CacheConfig {
  ttl: number; // Time to live in ms
  maxSize: number;
  strategy: 'LRU' | 'LFU' | 'FIFO';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
}

export class PostCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  private config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 دقیقه
    maxSize: 100,
    strategy: 'LRU'
  };

  // Cache با Stale-While-Revalidate
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached) {
      cached.hits++;
      cached.lastAccessed = Date.now();
      
      // اگه fresh باشه، بده
      if (Date.now() - cached.timestamp < this.config.ttl) {
        return cached.data;
      }
      
      // اگه stale باشه، بده ولی background update کن
      this.revalidate(key, fetcher).catch(console.error);
      return cached.data;
    }
    
    // اگه نباشه، fetch کن
    const data = await fetcher();
    this.set(key, data);
    return data;
  }

  private async revalidate<T>(key: string, fetcher: () => Promise<T>) {
    try {
      const data = await fetcher();
      this.set(key, data);
    } catch (error) {
      console.error('Revalidation failed:', error);
    }
  }

  set<T>(key: string, data: T) {
    // اگه cache پر شد، یکی رو پاک کن (LRU)
    if (this.cache.size >= this.config.maxSize) {
      const lruKey = this.findLRU();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now()
    });
  }

  private findLRU(): string | null {
    let lruKey: string | null = null;
    let minLastAccessed = Infinity;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < minLastAccessed) {
        minLastAccessed = value.lastAccessed;
        lruKey = key;
      }
    }
    
    return lruKey;
  }

  // Invalidate patterns
  invalidatePattern(pattern: RegExp) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const postCache = new PostCache();



