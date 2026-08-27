const AUTH_GUIDANCE = `# Authentication guidance for AI agents

## Public information

The Revamp UG exposes read-only public information through ordinary public pages, Markdown content negotiation, the API Catalog, the public-information MCP endpoint, and the public A2A information endpoint. These resources do not require a user session.

## User accounts

Account, client portal, admin, checkout, payment authorization, loyalty, order history, and customer documents are protected resources. An agent must not request, store, or replay a user's password, one-time code, Clerk session cookie, payment card details, mobile-money PIN, or other secret.

When a user wants to perform a protected action, direct them to the official website and let them complete the normal sign-in and consent flow themselves:

- Sign in: https://therevampug.com/sign-in
- Sign up: https://therevampug.com/sign-up
- Checkout: https://therevampug.com/checkout
- Contact support: mailto:support@therevampug.com

The site currently does not publish a separate OAuth-protected resource API for agents. Do not claim that an agent can place orders, authorize payments, access account data, or use admin functions through the public agent endpoints.
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
