import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/redis/rate-limit'

export const runtime = 'nodejs'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const VERIFY_TIMEOUT_MS = 5_000

type SiteverifyResponse = {
  success?: boolean
  action?: string
  hostname?: string
  'error-codes'?: string[]
}

function getForwardedIp(request: NextRequest) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
}

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'auth')
  if (limited) return limited

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is not configured')
    return NextResponse.json({ verified: false, configured: false, error: 'Security verification is not configured.' }, { status: 503 })
  }

  let body: { token?: unknown; action?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ verified: false, error: 'Invalid verification request.' }, { status: 400 })
  }

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const action = typeof body.action === 'string' ? body.action.trim() : ''
  if (!token || token.length > 2048) {
    return NextResponse.json({ verified: false, error: 'Complete the security verification and try again.' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS)

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: getForwardedIp(request),
        idempotency_key: crypto.randomUUID(),
      }),
      signal: controller.signal,
      cache: 'no-store',
    })
    const result = (await response.json()) as SiteverifyResponse

    if (!response.ok || !result.success) {
      console.warn('[turnstile] verification rejected', result['error-codes'] ?? [])
      return NextResponse.json({ verified: false, error: 'Security verification failed. Refresh the challenge and try again.' }, { status: 400 })
    }

    if (action && result.action !== action) {
      console.warn('[turnstile] action mismatch', { expected: action, received: result.action })
      return NextResponse.json({ verified: false, error: 'Security verification failed. Refresh the challenge and try again.' }, { status: 400 })
    }

    const allowedHostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || '')
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean)
    if (allowedHostnames.length > 0 && (!result.hostname || !allowedHostnames.includes(result.hostname.toLowerCase()))) {
      console.warn('[turnstile] hostname mismatch', { received: result.hostname })
      return NextResponse.json({ verified: false, error: 'Security verification failed. Refresh the challenge and try again.' }, { status: 400 })
    }

    return NextResponse.json({ verified: true })
  } catch (error) {
    console.error('[turnstile] verification request failed:', error)
    return NextResponse.json({ verified: false, error: 'Security verification is temporarily unavailable. Try again.' }, { status: 503 })
  } finally {
    clearTimeout(timeout)
  }
}
