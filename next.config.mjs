/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@getbrevo/brevo'],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/studio', destination: '/portfolio', permanent: true },
      { source: '/studio/:path*', destination: '/portfolio', permanent: true },
    ]
  },
}

export default nextConfig
