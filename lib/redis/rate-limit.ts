/**
 * Rate limiting using Upstash Ratelimit
 *
 * Limiters defined here:
 *   api         — general API endpoints       (60 req / 60s)
 *   auth        — sign-in / sign-up           (10 req / 60s)
 *   newsletter  — newsletter subscribe        (3  req / 60s)
 *   contact     — contact / quote forms       (5  req / 60s)
 *   upload      — media upload endpoints      (20 req / 60s)
 *   search      — search endpoint             (30 req / 60s)
 *   whatsapp    — WhatsApp click tracking     (10 req / 60s)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { redis, redisConfigured } from './client';
import { NextRequest, NextResponse } from 'next/server';

const slidingWindow = (tokens: number, window: string) =>
  Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]);

export const rateLimiters = {
  api:        new Ratelimit({ redis, limiter: slidingWindow(60,  '60 s'), prefix: 'rl:api' }),
  auth:       new Ratelimit({ redis, limiter: slidingWindow(10,  '60 s'), prefix: 'rl:auth' }),
  newsletter: new Ratelimit({ redis, limiter: slidingWindow(3,   '60 s'), prefix: 'rl:newsletter' }),
  contact:    new Ratelimit({ redis, limiter: slidingWindow(5,   '60 s'), prefix: 'rl:contact' }),
  upload:     new Ratelimit({ redis, limiter: slidingWindow(20,  '60 s'), prefix: 'rl:upload' }),
  search:     new Ratelimit({ redis, limiter: slidingWindow(30,  '60 s'), prefix: 'rl:search' }),
  whatsapp:   new Ratelimit({ redis, limiter: slidingWindow(10,  '60 s'), prefix: 'rl:whatsapp' }),
} as const;

export type RateLimiterKey = keyof typeof rateLimiters;

/**
 * Get the caller's IP from a Next.js request.
 */
function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Check rate limit for a route handler.
 * Returns null if allowed, or a 429 NextResponse if blocked.
 *
 * Usage in a route handler:
 *   const limited = await checkRateLimit(request, 'api');
 *   if (limited) return limited;
 */
export async function checkRateLimit(
  request: NextRequest,
  limiter: RateLimiterKey = 'api',
): Promise<NextResponse | null> {
  // Redis is optional for page availability. If it is down, fail open and log it.
  if (!redisConfigured) return null;

  const ip = getIP(request);
  let result: Awaited<ReturnType<typeof rateLimiters[typeof limiter]['limit']>>;
  try {
    result = await rateLimiters[limiter].limit(ip);
  } catch (error) {
    console.warn('[RateLimit] Redis unavailable; skipping rate limit:', error);
    return null;
  }
  const { success, limit, remaining, reset } = result;

  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please slow down.',
        limit,
        remaining: 0,
        reset: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(reset),
          'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  return null;
}
