'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Star, Users, Ticket, Crown, Calendar } from 'lucide-react'

const membershipNavItems = [
  { label: 'Dashboard', href: '/membership' },
  { label: 'Collections', href: '/membership/collections' },
  { label: 'Events', href: '/membership/events' },
  { label: 'Community', href: '/membership/community' },
  { label: 'Benefits', href: '/membership/benefits' },
]

type Membership = {
  type: string
  status: string
  benefits: string[]
} | null

type Event = {
  id: string
  title: string
  eventDate: string
  location: string | null
}

export default function MembershipDashboardClient({
  membership,
  upcomingEvents,
}: {
  membership: Membership
  upcomingEvents: Event[]
}) {
  return (
    <PortalLayout portalName="VIP Membership" portalSlug="membership" navItems={membershipNavItems}>
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              {membership ? `${membership.type} Member` : 'Membership'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Exclusive access to curated collections, private events, and concierge services.
          </p>
        </div>

        {membership ? (
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Membership Status</p>
                <p className="text-2xl font-light text-foreground capitalize">{membership.status}</p>
              </div>
              {membership.benefits.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Benefits</p>
                  <p className="text-sm text-foreground">{membership.benefits.length} included</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 border-dashed">
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-2">No active membership</p>
              <p className="text-sm text-muted-foreground/70">Membership data will appear here once enrolled.</p>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/membership/collections"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Star className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Exclusive Collections</h3>
            <p className="text-sm text-muted-foreground">Members-only curated selections</p>
          </Link>
          <Link
            href="/membership/events"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Ticket className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Private Events</h3>
            <p className="text-sm text-muted-foreground">Invitation-only showings and launches</p>
          </Link>
          <Link
            href="/membership/community"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Users className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Community</h3>
            <p className="text-sm text-muted-foreground">Connect with fellow collectors</p>
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-light text-foreground">Upcoming Member Events</h2>

          {upcomingEvents.length > 0 ? (
            <div className="grid gap-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    {event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 border-border/20 border-dashed flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-3">No events scheduled</p>
              <p className="text-sm text-muted-foreground/70">Events will be added through the admin panel.</p>
            </Card>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
