const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const dynamic = 'force-static'

export function GET() {
  return Response.json({
    name: 'the-revamp-ug-public-information',
    title: 'The Revamp UG Public Information MCP Server',
    description: 'Read-only public information tools for published products, services, portfolio projects, journal articles, and official pages.',
    version: '1.0.0',
    protocolVersion: '2025-06-18',
    transport: { type: 'streamable-http', endpoint: `${SITE_URL}/mcp` },
    authentication: { required: false },
    tools: [
      { name: 'search_public_content', description: 'Search current published public content.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 20 } }, required: ['query'] } },
      { name: 'read_public_page', description: 'Read a safe public page as Markdown.', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    ],
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
