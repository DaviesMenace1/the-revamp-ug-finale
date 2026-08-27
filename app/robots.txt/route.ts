const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

const ROBOTS = `# The Revamp UG crawler policy
User-agent: *
Allow: /
Disallow: /_next/
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /client/
Disallow: /checkout/
Disallow: /cart/
Disallow: /wishlist/
Disallow: /orders/
Disallow: /login/
Disallow: /sign-in/
Disallow: /sign-up/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /tmp/
Disallow: /private/
Content-Signal: ai-train=no, ai-input=yes, search=yes

# Search and answer-engine access is allowed for public pages. Private and transactional paths remain excluded.
User-agent: OAI-SearchBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /client/
Disallow: /checkout/
Disallow: /cart/
Disallow: /wishlist/
Disallow: /orders/
Disallow: /login/
Disallow: /sign-in/
Disallow: /sign-up/
Disallow: /auth/
Disallow: /dashboard/
Content-Signal: ai-train=no, ai-input=yes, search=yes

# Do not use the site as a training corpus. Public pages remain available for search and real-time grounding.
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /client/
Disallow: /checkout/
Disallow: /cart/
Disallow: /wishlist/
Disallow: /orders/
Disallow: /login/
Disallow: /sign-in/
Disallow: /sign-up/
Disallow: /auth/
Disallow: /dashboard/
Content-Signal: ai-train=no, ai-input=yes, search=yes

Sitemap: ${SITE_URL}/sitemap.xml
Host: ${SITE_URL}
`

export const dynamic = 'force-static'

export function GET() {
  return new Response(ROBOTS, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': 'ai-train=no, ai-input=yes, search=yes',
    },
  })
}
