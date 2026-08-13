/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@getbrevo/brevo','postgres', 'pg', 'drizzle-orm'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/studio', destination: '/portfolio', permanent: true },
      { source: '/studio/:path*', destination: '/portfolio', permanent: true },
    ]
  },
}

export default nextConfig
