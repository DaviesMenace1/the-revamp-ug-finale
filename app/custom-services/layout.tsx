import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Custom Furniture and Bespoke Interior Services | The Revamp UG',
  description: 'Explore bespoke furniture, custom upholstery, cabinetry, lighting, and interior styling services from The Revamp UG in Uganda.',
  keywords: ['custom furniture Uganda', 'custom upholstery Kampala', 'bespoke cabinetry Uganda', 'interior styling Kampala', 'The Revamp UG'],
  alternates: { canonical: `${SITE_URL}/custom-services` },
  openGraph: { type: 'website', url: `${SITE_URL}/custom-services`, title: 'Custom Furniture and Bespoke Interior Services', description: 'Bespoke furniture and interior services shaped around your space.' },
  twitter: { card: 'summary_large_image', title: 'Custom Furniture and Bespoke Interior Services', description: 'Bespoke furniture and interior services shaped around your space.' },
}

export default function CustomServicesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
