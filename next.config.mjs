/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@getbrevo/brevo','postgres', 'pg', 'drizzle-orm'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
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
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/studio', destination: '/portfolio', permanent: true },
      { source: '/studio/:path*', destination: '/portfolio', permanent: true },
    ]
  },
}

export default nextConfig
