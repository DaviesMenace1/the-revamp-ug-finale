/**
 * Cache utilities using Upstash Redis.
 * Redis is an optimization: if it is unavailable, callers still receive fresh data.
 */

import { redis } from './client'

export const TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
} as const

export const CACHE_KEYS = {
  products: (id?: string) => id ? `products:${id}` : 'products:all',
  productsList: (page: number, limit: number, cat?: string) => `products:list:${page}:${limit}:${cat ?? 'all'}`,
  projects: (id?: string) => id ? `projects:${id}` : 'projects:all',
  projectsList: (page: number, limit: number, cat?: string) => `projects:list:${page}:${limit}:${cat ?? 'all'}`,
  articles: (id?: string) => id ? `articles:${id}` : 'articles:all',
  articlesList: (page: number, limit: number, cat?: string) => `articles:list:${page}:${limit}:${cat ?? 'all'}`,
  user: (clerkId: string) => `user:${clerkId}`,
  cart: (userId: string) => `cart:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  brevoContact: (email: string) => `brevo:contact:${email}`,
  searchResults: (query: string) => `search:${Buffer.from(query).toString('base64').slice(0, 32)}`,
  navCounts: () => 'nav:counts',
  featuredItems: () => 'featured:items',
  siteSettings: () => 'site:settings',
} as const

export async function withCache<T>(key: string, fetcher: () => Promise<T>, ttl: number = TTL.MEDIUM): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null && cached !== undefined) return cached
  } catch (error) {
    console.warn(`[Redis] cache read skipped for ${key}:`, error)
  }

  const fresh = await fetcher()
  try {
    await redis.setex(key, ttl, JSON.stringify(fresh))
  } catch (error) {
    console.warn(`[Redis] cache write skipped for ${key}:`, error)
  }
  return fresh
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await redis.del(...keys)
  } catch (error) {
    console.warn('[Redis] invalidation skipped:', error)
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  let cursor = 0
  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = Number(nextCursor)
      if (keys.length > 0) await redis.del(...keys)
    } while (cursor !== 0)
  } catch (error) {
    console.warn(`[Redis] pattern invalidation skipped for ${pattern}:`, error)
  }
}

export async function setCache<T>(key: string, value: T, ttl: number = TTL.MEDIUM): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (error) {
    console.warn(`[Redis] cache write skipped for ${key}:`, error)
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key)
  } catch (error) {
    console.warn(`[Redis] cache read skipped for ${key}:`, error)
    return null
  }
}
