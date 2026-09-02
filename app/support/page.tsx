import type { Metadata } from 'next'
import PublicSupportPage from '@/components/support/public-support-page'

export const metadata: Metadata = {
  title: 'Support Desk',
  description: 'Get help with an order, project, consultation, product, account, or payment from The Revamp UG support desk.',
  alternates: { canonical: '/support' },
}

export default function SupportPage() {
  return <PublicSupportPage />
}
