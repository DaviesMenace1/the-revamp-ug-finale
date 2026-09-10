import { getPublicAgentMarkdown } from '@/lib/agent-public'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = url.searchParams.get('path') || '/'
  try {
    const markdown = await getPublicAgentMarkdown(path)
    return new Response(markdown, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[agent-markdown] failed:', error)
    return new Response('# The Revamp UG\n\nThe public information service is temporarily unavailable. Please use https://therevampug.com/ for the current website.', {
      status: 503,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Vary': 'Accept', 'Retry-After': '60' },
    })
  }
}
