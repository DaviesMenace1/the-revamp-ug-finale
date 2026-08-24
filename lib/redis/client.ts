import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const unavailableRedis = new Proxy({} as Redis, {
  get(_target, property: string | symbol) {
    return async () => {
      throw new Error(`Redis is not configured; attempted ${String(property)}()`)
    }
  },
})

// Keep module import safe. Cache/rate-limit callers decide whether to fail open.
export const redisConfigured = Boolean(url && token)
export const redis: Redis = redisConfigured
  ? new Redis({ url: url as string, token: token as string })
  : unavailableRedis

export default redis
