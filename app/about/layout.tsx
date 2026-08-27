import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'About The Revamp UG | Uganda Design House',
  description: 'Learn about The Revamp UG, a Uganda-based design house for interior design, architecture, furniture sourcing, custom pieces, and considered spaces.',
  keywords: ['The Revamp UG', 'interior design company Uganda', 'architecture company Kampala', 'Uganda design house'],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: { type: 'website', url: `${SITE_URL}/about`, title: 'About The Revamp UG', description: 'Meet the Uganda-based design house behind considered interiors, architecture, and furniture.' },
  twitter: { card: 'summary_large_image', title: 'About The Revamp UG', description: 'Meet the Uganda-based design house behind considered interiors, architecture, and furniture.' },
}

export default function AboutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
