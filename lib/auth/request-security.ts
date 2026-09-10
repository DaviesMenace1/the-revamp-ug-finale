import type { NextRequest } from 'next/server'

export function isTrustedAuthOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  const allowedOrigins = new Set([request.nextUrl.origin])
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configuredSiteUrl) {
    try {
      allowedOrigins.add(new URL(configuredSiteUrl).origin)
    } catch {
      // An invalid optional site URL must not broaden the allowlist.
    }
  }

  return allowedOrigins.has(origin)
}
