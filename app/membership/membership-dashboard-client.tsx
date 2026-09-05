'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Star, Users, Ticket, Crown, Calendar, ArrowRight } from '@/components/ui/luxury-icons'

const membershipNavItems = [
  { label: 'Dashboard', href: '/membership' },
  { label: 'Collections', href: '/membership/collections' },
  { label: 'Events', href: '/membership/events' },
  { label: 'Community', href: '/membership/community' },
  { label: 'Benefits', href: '/membership/benefits' },
]

type Rewards = {
  tier: string
  balancePoints: number
  lifetimeEarned: number
  tierPrivileges: ReadonlyArray<string>
  nextTier: string | null
  pointsToNextTier: number
  nextTierPoints: number | null
} | null

type Event = {
  id: string
  title: string
  eventDate: string
  location: string | null
}

export default function MembershipDashboard({ rewards, upcomingEvents }: { rewards: Rewards; upcomingEvents: Event[] }) {
  const progress = rewards?.nextTierPoints && rewards.nextTierPoints > 0
    ? Math.min(100, Math.round((rewards.lifetimeEarned / rewards.nextTierPoints) * 100))
    : 100

  return (
    <PortalLayout portalName="Revamp Membership" portalSlug="membership" navItems={membershipNavItems}>
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Crown className="size-8 text-primary" />
            <h1 className="font-serif text-4xl font-light text-foreground md:text-5xl">Your membership space</h1>
          </div>
          <p className="max-w-2xl text-muted-foreground">Your privileges grow with the points you accumulate through meaningful engagement with The Revamp UG.</p>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 sm:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current privilege band</p>
              <p className="mt-2 font-serif text-4xl font-light text-foreground">{rewards?.tier || 'Member'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{(rewards?.lifetimeEarned || 0).toLocaleString('en-UG')} accumulated points</p>
            </div>
            <div className="md:min-w-72 md:text-right">
              <p className="text-sm text-muted-foreground">Available balance</p>
              <p className="mt-1 font-serif text-3xl font-light text-foreground">{(rewards?.balancePoints || 0).toLocaleString('en-UG')} points</p>
            </div>
          </div>
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground"><span>{rewards?.nextTier ? `${rewards.pointsToNextTier.toLocaleString('en-UG')} points to ${rewards.nextTier}` : 'Highest current privilege band'}</span><span>{progress}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/70"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div>
          </div>
        </Card>

        <section>
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Your current privileges</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">Access that grows with you.</h2></div><Link href="/membership/benefits" className="hidden items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary sm:flex">View all benefits <ArrowRight className="size-4" /></Link></div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{(rewards?.tierPrivileges.length ? rewards.tierPrivileges : ['Access to the Revamp membership space']).map((privilege) => <Card key={privilege} className="p-6"><Star className="size-5 text-primary" /><p className="mt-5 text-sm leading-6 text-foreground">{privilege}</p></Card>)}</div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/membership/collections" className="rounded-lg border border-border/60 p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"><Star className="mb-3 size-8 text-primary" /><h3 className="font-medium text-foreground">Member collections</h3><p className="mt-1 text-sm text-muted-foreground">Explore selections connected to your current privileges.</p></Link>
          <Link href="/membership/events" className="rounded-lg border border-border/60 p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"><Ticket className="mb-3 size-8 text-primary" /><h3 className="font-medium text-foreground">Private events</h3><p className="mt-1 text-sm text-muted-foreground">See invitations and studio gatherings available to members.</p></Link>
          <Link href="/membership/community" className="rounded-lg border border-border/60 p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"><Users className="mb-3 size-8 text-primary" /><h3 className="font-medium text-foreground">Community</h3><p className="mt-1 text-sm text-muted-foreground">Connect with fellow collectors and design-minded members.</p></Link>
        </div>

        <section className="space-y-4"><h2 className="font-serif text-2xl font-light text-foreground">Upcoming member events</h2>{upcomingEvents.length > 0 ? <div className="grid gap-3">{upcomingEvents.map((event) => <Card key={event.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-foreground">{event.title}</p>{event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}</div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="size-4" />{new Date(event.eventDate).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}</div></Card>)}</div> : <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center"><p className="text-muted-foreground">No events scheduled</p><p className="mt-2 text-sm text-muted-foreground/70">New invitations will appear here as the studio publishes them.</p></Card>}</section>
      </div>
    </PortalLayout>
  )
}
