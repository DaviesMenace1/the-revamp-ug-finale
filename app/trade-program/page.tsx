import type { Metadata } from 'next'
import { getCurrentUser, getUserTradeMember } from '@/lib/auth/utils'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import TradeApplicationClient from './trade-application-client'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Trade Programme | The Revamp UG',
  description: 'Apply for professional trade access with The Revamp UG.',
  alternates: { canonical: `${SITE_URL}/trade-program` },
  openGraph: {
    title: 'Trade Programme | The Revamp UG',
    description: 'Apply for professional trade access with The Revamp UG.',
    url: `${SITE_URL}/trade-program`,
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

export default async function TradeProgramPage() {
  const user = await getCurrentUser()
  const member = user ? await getUserTradeMember(user.id) : null
  const isMember = ['approved', 'active'].includes(String(member?.status || '').toLowerCase())

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground">
        <TradeApplicationClient isMember={isMember} />
      </main>
      <SiteFooter />
    </>
  )
}
