import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/redis/rate-limit'
import { isValidAuthEmail, normalizeAuthEmail } from '@/lib/auth/input-validation'
import { isTrustedAuthOrigin } from '@/lib/auth/request-security'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isTrustedAuthOrigin(request)) {
    return NextResponse.json({ allowed: false, error: 'Invalid authentication origin.' }, { status: 403 })
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 4096) {
    return NextResponse.json({ allowed: false, error: 'Authentication request is too large.' }, { status: 413 })
  }

  let identifier: string | undefined
  try {
    const body = await request.json()
    if (body && typeof body === 'object' && 'identifier' in body && body.identifier !== undefined) {
      if (typeof body.identifier !== 'string' || body.identifier.length > 254) {
        return NextResponse.json({ allowed: false, error: 'Invalid authentication request.' }, { status: 400 })
      }
      identifier = normalizeAuthEmail(body.identifier)
      if (!isValidAuthEmail(identifier)) {
        return NextResponse.json({ allowed: false, error: 'Enter a valid email address.' }, { status: 400 })
      }
    }
  } catch {
    return NextResponse.json({ allowed: false, error: 'Invalid authentication request.' }, { status: 400 })
  }

  const limited = await checkRateLimit(request, 'auth', identifier)
  if (limited) return limited

  return NextResponse.json({ allowed: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
