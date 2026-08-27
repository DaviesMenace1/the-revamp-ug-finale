const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

const serverCard = {
  $schema: 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
  version: '1.0',
  protocolVersion: '2025-06-18',
  serverInfo: {
    name: 'the-revamp-ug-public-information',
    title: 'The Revamp UG Public Information MCP Server',
    version: '1.0.0',
  },
  description: 'Read-only access to current public information from The Revamp UG, including published products, services, portfolio projects, journal articles, and public pages.',
  transport: {
    type: 'streamable-http',
    endpoint: `${SITE_URL}/mcp`,
  },
  authentication: {
    required: false,
  },
  tools: [
    {
      name: 'search_public_content',
      title: 'Search public content',
      description: 'Search current published products, portfolio projects, services, and journal articles.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 20 },
        },
        required: ['query'],
      },
    },
    {
      name: 'read_public_page',
      title: 'Read a public page',
      description: 'Read a safe public website path as Markdown.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'A public path such as /services or /portfolio' },
        },
        required: ['path'],
      },
    },
  ],
}

export const dynamic = 'force-static'

export function GET() {
  return Response.json(serverCard, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
