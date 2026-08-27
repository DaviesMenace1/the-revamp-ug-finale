import type { Metadata } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'FAQs | Interior Design, Architecture, Furniture and Orders',
  description: 'Find answers about The Revamp UG services, architecture, interior design, furniture collections, sourcing, orders, delivery, payments, returns, and consultations.',
  keywords: ['The Revamp UG FAQs', 'interior design Uganda questions', 'furniture delivery Uganda', 'architecture consultation Kampala'],
  alternates: { canonical: `${SITE_URL}/faqs` },
  openGraph: { type: 'website', url: `${SITE_URL}/faqs`, title: 'Frequently Asked Questions | The Revamp UG', description: 'Answers about design services, furniture, orders, delivery, and consultations.' },
  twitter: { card: 'summary_large_image', title: 'Frequently Asked Questions | The Revamp UG', description: 'Answers about design services, furniture, orders, delivery, and consultations.' },
}

export default function FaqsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
