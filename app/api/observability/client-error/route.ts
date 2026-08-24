import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/redis/rate-limit'
import { reportServerError } from '@/lib/observability/betterstack'

export const runtime = 'nodejs'

function stringValue(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.slice(0, maxLength) : undefined
}

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'api')
  if (limited) return limited

  try {
    const body = (await request.json()) as { message?: unknown; name?: unknown; stack?: unknown; path?: unknown; digest?: unknown }
    const message = stringValue(body.message, 500) || 'Unknown client error'
    const error = new Error(message)
    error.name = stringValue(body.name, 100) || 'ClientError'
    error.stack = stringValue(body.stack, 4_000)

    reportServerError('Client application error', error, {
      source: 'browser-error-boundary',
      path: stringValue(body.path, 500),
      digest: stringValue(body.digest, 200),
    })
  } catch (error) {
    console.warn('[observability] malformed client-error event:', error)
  }

  return new NextResponse(null, { status: 204 })
}
