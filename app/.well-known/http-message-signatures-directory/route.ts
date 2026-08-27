import { createHash, createPrivateKey, sign } from 'node:crypto'
import { NextRequest } from 'next/server'

const CONTENT_TYPE = 'application/http-message-signatures-directory+json'

function readPublicJwk() {
  const raw = process.env.WEB_BOT_AUTH_PUBLIC_JWK?.trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed.kty !== 'OKP' || parsed.crv !== 'Ed25519' || typeof parsed.x !== 'string' || !parsed.x) return null
    return {
      kty: 'OKP',
      crv: 'Ed25519',
      x: parsed.x,
      ...(typeof parsed.kid === 'string' && parsed.kid ? { kid: parsed.kid } : {}),
      ...(parsed.use === 'sig' ? { use: 'sig' } : {}),
    }
  } catch {
    return null
  }
}

function keyThumbprint(jwk: { kty: string; crv: string; x: string }) {
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })
  return createHash('sha256').update(canonical).digest('base64url')
}

function readPrivateKey() {
  const raw = process.env.WEB_BOT_AUTH_PRIVATE_KEY?.replace(/\\n/g, '\n').trim()
  return raw || null
}

function responseHeaders() {
  return {
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Content-Type': CONTENT_TYPE,
    'X-Content-Type-Options': 'nosniff',
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const publicJwk = readPublicJwk()
  const privateKeyValue = readPrivateKey()
  if (!publicJwk || !privateKeyValue) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const keyid = keyThumbprint(publicJwk)
    const created = Math.floor(Date.now() / 1000)
    const expires = created + 300
    const signatureParams = `("@authority";req);alg="ed25519";keyid="${keyid}";tag="http-message-signatures-directory";created=${created};expires=${expires}`
    const authority = request.headers.get('host') || request.nextUrl.host
    const signatureBase = `"@authority": ${authority}\n"@signature-params": ${signatureParams}`
    const signature = sign(null, Buffer.from(signatureBase), createPrivateKey(privateKeyValue)).toString('base64')
    const body = JSON.stringify({ keys: [{ ...publicJwk, kid: keyid, use: 'sig' }] })

    return new Response(body, {
      headers: {
        ...responseHeaders(),
        Signature: `sig1=:${signature}:`,
        'Signature-Input': `sig1=${signatureParams}`,
      },
    })
  } catch (error) {
    console.error('[web-bot-auth] invalid key configuration:', error)
    return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}

export function HEAD(request: NextRequest) {
  const publicJwk = readPublicJwk()
  const privateKeyValue = readPrivateKey()
  if (!publicJwk || !privateKeyValue) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  const response = GET(request)
  return new Response(null, { status: response.status, headers: response.headers })
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...responseHeaders(),
      Allow: 'GET, HEAD, OPTIONS',
    },
  })
}
