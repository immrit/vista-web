import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '@/lib/env';

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function createLimiter(
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
  prefix: string,
): Ratelimit | null {
  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter,
    analytics: true,
    prefix,
  });
}

export const authRateLimit = createLimiter(Ratelimit.slidingWindow(5, '15 m'), '@vista/auth');
export const apiRateLimit = createLimiter(Ratelimit.slidingWindow(60, '1 m'), '@vista/api');
export const uploadRateLimit = createLimiter(Ratelimit.slidingWindow(10, '1 h'), '@vista/upload');
export const messageRateLimit = createLimiter(
  Ratelimit.slidingWindow(100, '1 m'),
  '@vista/message',
);

interface RateLimitResult {
  success: boolean;
  limit: number;
  reset: number;
  remaining: number;
  retryAfter: number | null;
}

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null = apiRateLimit,
): Promise<RateLimitResult> {
  if (!limiter) {
    return {
      success: true,
      limit: 0,
      reset: 0,
      remaining: 0,
      retryAfter: null,
    };
  }

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    return {
      success,
      limit,
      reset,
      remaining,
      retryAfter: success ? null : Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return {
      success: true,
      limit: 0,
      reset: 0,
      remaining: 0,
      retryAfter: null,
    };
  }
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || '';

  if (ip) {
    return ip;
  }

  const ua = request.headers.get('user-agent') || 'unknown';
  return `ua:${ua}`;
}

