const AUTH_GUIDANCE = `# auth.md

You are an agent that wants to read public information from The Revamp UG.

## Current state

The Revamp UG does not currently support Auth.md agent registration, OAuth Protected Resource Metadata, ID-JAG identity assertions, claim ceremonies, agent-issued access tokens, or agent access to customer accounts. There is no /agent/identity, /oauth2/token, or /oauth2/revoke implementation on this site. Do not invent credentials or attempt those flows.

The public agent surfaces are intentionally read-only and do not require a user session. They provide current public information about services, published products, portfolio projects, journal articles, FAQs, contact details, and public pages.

## Public access

Use these public surfaces without asking a user for credentials:

- Public page Markdown: https://www.therevampug.com/api/agent/markdown?path=/services
- Public search: https://www.therevampug.com/api/agent/search
- A2A Agent Card: https://www.therevampug.com/.well-known/agent-card.json
- Public A2A endpoint: https://www.therevampug.com/api/agent/a2a
- MCP Server Card: https://www.therevampug.com/.well-known/mcp/server-card.json
- MCP endpoint: https://www.therevampug.com/mcp
- API Catalog: https://www.therevampug.com/.well-known/api-catalog
- Agent Skills index: https://www.therevampug.com/.well-known/agent-skills/index.json
- ARD manifest: https://www.therevampug.com/.well-known/ard.json

## Protected actions

Account, client portal, admin, checkout, payment authorization, loyalty, order history, consultation booking, and customer documents are protected or transactional resources. Do not request, store, or replay a user's password, one-time code, Clerk session cookie, payment card details, mobile-money PIN, or other secret.

When a user wants to perform a protected action, direct them to the official website and let them complete the normal sign-in and consent flow themselves:

- Sign in: https://www.therevampug.com/sign-in
- Sign up: https://www.therevampug.com/sign-up
- Book a consultation: https://www.therevampug.com/book-consultation
- Checkout: https://www.therevampug.com/checkout
- Contact support: mailto:support@therevampug.com

## Data boundaries

Do not claim that an agent can place orders, authorize payments, access account data, access admin functions, read private documents, or change customer records through the public agent endpoints. Use official public pages as the source of truth, and do not infer prices, availability, delivery times, certifications, awards, or other claims that are not stated on the relevant page.

## Integration contact

For agent integration questions, contact support@therevampug.com. The Revamp UG is based in Kyanja, Kampala, Uganda and can also be reached at +256 783 476 807.
`

export const dynamic = 'force-static'

export function GET() {
  return new Response(AUTH_GUIDANCE, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function HEAD() {
  return new Response(null, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
