import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Contact The Revamp UG | Interior Design and Architecture in Uganda',
  description: 'Contact The Revamp UG in Kyanja, Kampala for interior design, architecture, furniture sourcing, custom furniture, procurement, and project enquiries.',
  keywords: ['contact interior designer Uganda', 'architecture company Kampala', 'furniture sourcing Uganda', 'The Revamp UG contact'],
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: { type: 'website', url: `${SITE_URL}/contact`, title: 'Contact The Revamp UG', description: 'Start a conversation about your interior, architecture, furniture, or sourcing project.' },
  twitter: { card: 'summary_large_image', title: 'Contact The Revamp UG', description: 'Start a conversation about your interior, architecture, furniture, or sourcing project.' },
}

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
