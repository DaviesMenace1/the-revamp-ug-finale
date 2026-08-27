const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')
const PROFILE = 'https://www.rfc-editor.org/info/rfc9727'

const catalog = {
  linkset: [
    {
      anchor: `${SITE_URL}/.well-known/api-catalog`,
      item: [
        { href: `${SITE_URL}/api/products`, rel: ['item'], title: 'Published product catalogue', type: 'application/json' },
        { href: `${SITE_URL}/api/projects`, rel: ['item'], title: 'Published portfolio projects', type: 'application/json' },
        { href: `${SITE_URL}/api/services`, rel: ['item'], title: 'Published design services', type: 'application/json' },
        { href: `${SITE_URL}/api/articles`, rel: ['item'], title: 'Published journal articles', type: 'application/json' },
        { href: `${SITE_URL}/api/faqs`, rel: ['item'], title: 'Public frequently asked questions', type: 'application/json' },
      ],
    },
  ],
}

const headers = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
  'Content-Type': `application/linkset+json; profile="${PROFILE}"`,
  'Link': `</.well-known/api-catalog>; rel="api-catalog"`,
  'X-Content-Type-Options': 'nosniff',
}

export const dynamic = 'force-static'

export function GET() {
  return Response.json(catalog, { headers })
}

export function HEAD() {
  return new Response(null, { headers })
}
