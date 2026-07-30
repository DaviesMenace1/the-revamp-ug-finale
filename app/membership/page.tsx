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
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Membership Status</p>
              <p className="font-serif text-3xl font-light text-foreground mb-6">Active</p>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Member Since:</span> <span className="text-foreground">January 15, 2024</span></p>
                <p><span className="text-muted-foreground">Renewal Date:</span> <span className="text-foreground">January 15, 2025</span></p>
                <p><span className="text-muted-foreground">Lifetime Points:</span> <span className="text-foreground font-medium text-primary">2,450</span></p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Member Perks</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-foreground">25% discount on all collections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-foreground">Private shopping events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-foreground">Concierge design consultation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-foreground">Early access to new collections</span>
                </li>
              </ul>
            </div>
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
          <div className="grid gap-4">
            {[
              { name: 'Spring Collection Preview', date: 'April 5, 2024', location: 'Kampala Studio' },
              { name: 'Designer Meet & Greet', date: 'April 18, 2024', location: 'Private Venue' },
              { name: 'VIP Shopping Night', date: 'May 1, 2024', location: 'Flagship Store' },
            ].map(event => (
              <Card key={event.name} className="p-4 border-border/20 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.date} • {event.location}</p>
                  </div>
                  <button className="text-primary text-sm font-medium hover:text-primary/80">RSVP →</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
