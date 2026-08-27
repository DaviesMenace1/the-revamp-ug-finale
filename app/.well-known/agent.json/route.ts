import { PUBLIC_AGENT_CARD, PUBLIC_AGENT_CARD_HEADERS } from '@/lib/agent-card'

export const dynamic = 'force-static'

export function GET() {
  return new Response(JSON.stringify(PUBLIC_AGENT_CARD), {
    headers: PUBLIC_AGENT_CARD_HEADERS,
  })
}

export function HEAD() {
  return new Response(null, {
    headers: PUBLIC_AGENT_CARD_HEADERS,
  })
}
