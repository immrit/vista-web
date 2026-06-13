const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

export function memoryRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}
