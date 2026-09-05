/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@getbrevo/brevo','postgres', 'pg', 'drizzle-orm'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Link', value: '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </.well-known/ard.json>; rel="ard"; type="application/json", </.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"' },
        ],
      },
    ]
  },
  async rewrites() {
    const markdownPages = [
      '/',
      '/about',
      '/services',
      '/services/:path*',
      '/collections',
      '/collections/:path*',
      '/portfolio',
      '/portfolio/:path*',
      '/journal',
      '/journal/:path*',
      '/contact',
      '/support',
      '/faqs',
      '/custom-services',
      '/source-with-revamp',
      '/trade-program',
      '/membership-program',
      '/book-consultation',
      '/request-quote',
      '/product-inquiry',
      '/refund-policy',
      '/return-policy',
      '/legal/:path*',
    ]
    return {
      beforeFiles: markdownPages.map((source) => ({
        source,
        destination: `/api/agent/markdown?path=${source}`,
        has: [{ type: 'header', key: 'accept', value: '(?:^|,\\s*)text/markdown(?:,|$)' }],
      })),
    }
  },
  async redirects() {
    return [
      { source: '/studio', destination: '/portfolio', permanent: true },
      { source: '/studio/:path*', destination: '/portfolio', permanent: true },
      { source: '/sitemap.ts', destination: '/sitemap.xml', permanent: true },
      { source: '/sitemap', destination: '/sitemap.xml', permanent: true },
    ]
  },
}

export default nextConfig
