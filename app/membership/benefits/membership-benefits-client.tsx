'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Check, Zap, Gift, ArrowRight } from '@/components/ui/luxury-icons'
import BrowserNotificationPrompt from '@/components/notifications/browser-notification-prompt'
import Link from 'next/link'

const membershipNavItems = [
  { label: 'Overview', href: '/membership' },
  { label: 'Collections', href: '/membership/collections' },
  { label: 'Events', href: '/membership/events' },
  { label: 'Community', href: '/membership/community' },
  { label: 'Benefits', href: '/membership/benefits' },
]

type Rewards = {
  tier: string
  lifetimeEarned: number
  balancePoints: number
  tierPrivileges: ReadonlyArray<string>
  nextTier: string | null
  pointsToNextTier: number
} | null

export default function MembershipBenefitsClient({ rewards }: { rewards: Rewards }) {
  return (
    <PortalLayout portalName="Revamp Membership" portalSlug="membership" navItems={membershipNavItems}>
      <div className="space-y-12">
        <BrowserNotificationPrompt context="membership" />
        <div><p className="text-xs uppercase tracking-[0.2em] text-primary">Points-led access</p><h1 className="mt-3 font-serif text-4xl font-light text-foreground md:text-5xl">Membership privileges</h1><p className="mt-3 max-w-2xl text-lg text-muted-foreground">There is no membership fee. Your access grows through the points you accumulate with The Revamp UG.</p></div>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">Your current band</p><p className="mt-1 font-serif text-4xl font-light text-foreground">{rewards?.tier || 'Member'}</p></div><div className="sm:text-right"><p className="text-sm text-muted-foreground">Accumulated points</p><p className="mt-1 font-serif text-3xl font-light text-foreground">{(rewards?.lifetimeEarned || 0).toLocaleString('en-UG')}</p></div></div>{rewards?.nextTier && <p className="mt-5 text-sm text-muted-foreground">{rewards.pointsToNextTier.toLocaleString('en-UG')} more points to reach {rewards.nextTier}.</p>}</section>

        <section><div className="flex items-center gap-3"><Zap className="size-6 text-primary" /><h2 className="font-serif text-3xl font-light text-foreground">Privileges in your current band</h2></div><div className="mt-6 grid gap-4 md:grid-cols-3">{(rewards?.tierPrivileges.length ? rewards.tierPrivileges : ['Access to the Revamp membership space']).map((privilege) => <article key={privilege} className="rounded-lg border border-border/60 p-6"><Check className="size-5 text-primary" /><p className="mt-5 text-sm leading-6 text-foreground">{privilege}</p></article>)}</div></section>

        <section className="rounded-xl border border-border/70 p-6 sm:p-8"><div className="flex items-start gap-4"><Gift className="mt-1 size-6 text-primary" /><div><h2 className="font-serif text-2xl font-light text-foreground">Keep building your points</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">Points can be accumulated through qualifying purchases, referrals, reviews, account activity, and other actions configured by the studio. The thresholds and privileges are managed by the Revamp team.</p><Link href="/membership" className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">Return to membership space <ArrowRight className="size-4" /></Link></div></div></section>
      </div>
    </PortalLayout>
  )
}
