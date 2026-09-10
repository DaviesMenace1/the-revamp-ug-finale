import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/redis'
import { searchPublicAgentContent } from '@/lib/agent-public'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'api')
  if (limited) return limited
  try {
    const body = await request.json() as { query?: unknown; limit?: unknown }
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (!query) return Response.json({ error: 'A search query is required.' }, { status: 400 })
    const rawLimit = Number(body.limit)
    const limit = Number.isFinite(rawLimit) ? rawLimit : 10
    return Response.json({ success: true, data: await searchPublicAgentContent(query, limit) }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[agent-search] failed:', error)
    return Response.json({ error: 'The public search service is temporarily unavailable.' }, { status: 503 })
  }
}
