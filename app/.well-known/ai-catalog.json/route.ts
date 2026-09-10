import { PUBLIC_AGENT_CATALOG, PUBLIC_AGENT_CATALOG_HEADERS } from '@/lib/agent-catalog'

export const dynamic = 'force-static'

export function GET() {
  return new Response(JSON.stringify(PUBLIC_AGENT_CATALOG), {
    headers: PUBLIC_AGENT_CATALOG_HEADERS,
  })
}

export function HEAD() {
  return new Response(null, {
    headers: PUBLIC_AGENT_CATALOG_HEADERS,
  })
}
