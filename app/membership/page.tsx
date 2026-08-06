'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Star, Users, Ticket, Crown } from 'lucide-react'

const membershipNavItems = [
  { label: 'Dashboard', href: '/membership' },
  { label: 'Collections', href: '/membership/collections' },
  { label: 'Events', href: '/membership/events' },
  { label: 'Community', href: '/membership/community' },
  { label: 'Benefits', href: '/membership/benefits' },
]

export default function MembershipDashboard() {
  return (
    <PortalLayout
      portalName="VIP Membership"
      portalSlug="membership"
      navItems={membershipNavItems}
    >
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-primary" />
                <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
                  Collector Member
                </h1>
              </div>
              <p className="text-muted-foreground">
                Exclusive access to curated collections, private events, and concierge services.
              </p>
            </div>
          </div>
        </div>

        {/* Membership Card */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 border-dashed">
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">No active membership</p>
            <p className="text-sm text-muted-foreground/70">Membership data will appear here once enrolled.</p>
          </div>
        </Card>

        {/* Quick Access */}
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

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-light text-foreground">Upcoming Member Events</h2>
          <Card className="p-8 border-border/20 border-dashed flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-3">No events scheduled</p>
            <p className="text-sm text-muted-foreground/70">Events will be added through the admin panel.</p>
          </Card>
        </div>
      </div>
    </PortalLayout>
  )
}
