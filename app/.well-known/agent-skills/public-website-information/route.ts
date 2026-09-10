import { PUBLIC_INFORMATION_SKILL } from '@/lib/agent-skills'

export const dynamic = 'force-static'

export function GET() {
  return new Response(PUBLIC_INFORMATION_SKILL, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
