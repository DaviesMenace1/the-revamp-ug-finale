const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.therevampug.com').replace(/\/$/, '')

export const PUBLIC_AGENT_CATALOG = {
  '@context': 'https://agenticresourcediscovery.org/context/v1',
  specVersion: '0.91',
  entries: [
    {
      identifier: 'urn:air:therevampug.com:agent:public-information',
      displayName: 'The Revamp UG Public Information Agent',
      type: 'application/a2a-agent-card+json',
      url: `${SITE_URL}/.well-known/agent-card.json`,
      description: 'Read-only A2A agent for current public information about The Revamp UG.',
      capabilities: ['public-information', 'published-products', 'published-services', 'published-projects', 'published-journal'],
      representativeQueries: ['What interior design services does The Revamp UG offer?', 'Find published sofa products.', 'How can I book a consultation?'],
    },
    {
      identifier: 'urn:air:therevampug.com:mcp:public-information',
      displayName: 'The Revamp UG Public Information MCP Server',
      type: 'application/mcp-server-card+json',
      url: `${SITE_URL}/.well-known/mcp/server-card.json`,
      description: 'Read-only MCP server for current public website information.',
      capabilities: ['search-public-content', 'read-public-page'],
      representativeQueries: ['Search the published collection for sofas.', 'Read the public services page.'],
    },
    {
      identifier: 'urn:air:therevampug.com:skill:public-website-information',
      displayName: 'Public Website Information Skill',
      type: 'application/ai-skill+md',
      url: `${SITE_URL}/.well-known/agent-skills/public-website-information`,
      description: 'Guidance for safely reading public information from The Revamp UG.',
      capabilities: ['read-only', 'public-information'],
      representativeQueries: ['Use official pages to answer a question about The Revamp UG.'],
    },
    {
      identifier: 'urn:air:therevampug.com:api:public-catalog',
      displayName: 'The Revamp UG Public API Catalog',
      type: 'application/linkset+json',
      url: `${SITE_URL}/.well-known/api-catalog`,
      description: 'RFC 9727 linkset for published public product, project, service, article, and FAQ resources.',
      capabilities: ['published-products', 'published-services', 'published-projects', 'published-journal', 'public-faqs'],
      representativeQueries: ['Find the public product and service resources for The Revamp UG.'],
    },
  ],
} as const

export const PUBLIC_AGENT_CATALOG_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
}
