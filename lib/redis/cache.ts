/**
 * Cache utilities using Upstash Redis
 *
 * TTL presets (seconds):
 *   SHORT   — 60s    (live stock, prices)
 *   MEDIUM  — 300s   (product listings, project lists)
 *   LONG    — 3600s  (articles, static content)
 *   DAY     — 86400s (rarely changing config)
 */

import { redis } from './client';

export const TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
} as const;

// Cache key namespaces — keeps keys organised in Upstash console
export const CACHE_KEYS = {
  products:       (id?: string) => id ? `products:${id}` : 'products:all',
  productsList:   (page: number, limit: number, cat?: string) => `products:list:${page}:${limit}:${cat ?? 'all'}`,
  projects:       (id?: string) => id ? `projects:${id}` : 'projects:all',
  projectsList:   (page: number, limit: number) => `projects:list:${page}:${limit}`,
  articles:       (id?: string) => id ? `articles:${id}` : 'articles:all',
  articlesList:   (page: number, limit: number, cat?: string) => `articles:list:${page}:${limit}:${cat ?? 'all'}`,
  user:           (clerkId: string) => `user:${clerkId}`,
  cart:           (userId: string) => `cart:${userId}`,
  session:        (sessionId: string) => `session:${sessionId}`,
  brevoContact:   (email: string) => `brevo:contact:${email}`,
  searchResults:  (query: string) => `search:${Buffer.from(query).toString('base64').slice(0, 32)}`,
  navCounts:      () => 'nav:counts',
  featuredItems:  () => 'featured:items',
  siteSettings:   () => 'site:settings',
} as const;

/**
 * Get a cached value or fetch it fresh, then cache the result.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = TTL.MEDIUM,
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }
  const fresh = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}

/**
 * Invalidate one or more cache keys.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis.del(...keys);
}

/**
 * Invalidate all keys matching a pattern prefix (e.g. 'products:list:*').
 * Uses SCAN so it never blocks the server.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  let cursor = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
    cursor = Number(nextCursor);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== 0);
}

/**
 * Store a value with an explicit TTL (convenience wrapper).
 */
export async function setCache<T>(key: string, value: T, ttl: number = TTL.MEDIUM): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

/**
 * Get a raw cached value (returns null on miss).
 */
export async function getCache<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}
