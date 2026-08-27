const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.therevampug.com').replace(/\/$/, '')

const agentCard = {
  name: 'The Revamp UG Public Information Agent',
  description: 'Read-only agent for current public information about The Revamp UG services, published products, portfolio projects, journal articles, contact details, and public pages.',
  supportedInterfaces: [
    {
      url: `${SITE_URL}/api/agent/a2a`,
      protocolBinding: 'HTTP+JSON',
      protocolVersion: '1.0',
    },
  ],
  provider: {
    organization: 'The Revamp UG',
    url: SITE_URL,
  },
  capabilities: {
    streaming: false,
    pushNotifications: false,
    extendedAgentCard: false,
  },
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  skills: [
    {
      id: 'public-website-information',
      name: 'Public Website Information',
      description: 'Find current public information from published website records and official pages.',
      tags: ['services', 'products', 'portfolio', 'journal', 'contact'],
      examples: ['What interior design services does The Revamp UG offer?', 'Find published sofa products.', 'How can I book a consultation?'],
      inputModes: ['text/plain'],
      outputModes: ['text/plain'],
    },
  ],
  securitySchemes: {},
  securityRequirements: [],
}

export const dynamic = 'force-static'

export function GET() {
  return Response.json(agentCard, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
