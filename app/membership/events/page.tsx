'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users } from 'lucide-react'

export default function MembershipEvents() {
  const events = [
    {
      id: 1,
      title: 'Design Masterclass with Faridah',
      date: 'August 15, 2024',
      time: '6:00 PM - 8:00 PM',
      location: 'The Revamp Studio, Kampala',
      capacity: '20 members',
      tier: 'Silver+',
      description: 'Join founder Faridah Nakayiwa for an exclusive design masterclass exploring the future of East African luxury interiors.',
      status: 'registered',
    },
    {
      id: 2,
      title: 'Exclusive Showroom Preview',
      date: 'August 22, 2024',
      time: '4:00 PM - 6:00 PM',
      location: 'The Revamp Showroom, Kololo',
      capacity: '30 members',
      tier: 'All Members',
      description: 'First look at our Fall 2024 collection before public launch. Complimentary refreshments included.',
      status: 'available',
    },
    {
      id: 3,
      title: 'Sourcing Trip to Morocco',
      date: 'September 10-15, 2024',
      time: 'Multi-day',
      location: 'Marrakech & Fes, Morocco',
      capacity: '12 members',
      tier: 'Gold+',
      description: 'Curated international sourcing experience with artisan workshops, market visits, and exclusive networking.',
      status: 'waitlist',
    },
    {
      id: 4,
      title: 'Member Appreciation Gala',
      date: 'September 28, 2024',
      time: '7:00 PM - 11:00 PM',
      location: 'Serena Hotel, Kampala',
      capacity: '100 members',
      tier: 'Platinum+',
      description: 'Annual celebration of our community with live music, curated dining, and exclusive announcements.',
      status: 'available',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge className="bg-green-500/10 text-green-700">Registered</Badge>
      case 'waitlist':
        return <Badge className="bg-yellow-500/10 text-yellow-700">On Waitlist</Badge>
      default:
        return <Badge variant="outline">Available</Badge>
    }
  }

  return (
    <PortalLayout
      portalName="VIP Membership"
      portalSlug="membership"
      navItems={[
        { label: 'Dashboard', href: '/membership' },
        { label: 'Collections', href: '/membership/collections' },
        { label: 'Events', href: '/membership/events' },
        { label: 'Community', href: '/membership/community' },
        { label: 'Benefits', href: '/membership/benefits' },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground mb-2">Member Events</h1>
          <p className="text-lg text-muted-foreground">Exclusive gatherings, workshops, and experiences for our community.</p>
        </div>
        {events.map(event => (
          <div
            key={event.id}
            className="border border-border/20 rounded-lg p-6 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h3 className="font-serif text-xl font-light text-foreground mb-2">{event.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground font-light">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {event.capacity}
                  </div>
                </div>
              </div>
              {getStatusBadge(event.status)}
            </div>

            <p className="text-muted-foreground font-light mb-4">{event.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground font-light">
                <span>{event.time}</span>
                <span className="text-xs text-gold uppercase tracking-wider">{event.tier}</span>
              </div>
              <Button
                variant={event.status === 'registered' ? 'outline' : 'default'}
                size="sm"
                className="rounded-none"
              >
                {event.status === 'registered' ? 'Registered' : event.status === 'waitlist' ? 'Join Waitlist' : 'Register'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  )
}
