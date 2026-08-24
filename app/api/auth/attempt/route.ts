import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/redis/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'auth')
  if (limited) return limited

  return NextResponse.json({ allowed: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
