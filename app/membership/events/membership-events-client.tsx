'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { PortalLayout } from '@/components/portals/portal-layout'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, MapPin, Users } from 'lucide-react'
import { rsvpToEvent, cancelRsvp } from '@/lib/actions/events'

const membershipNavItems = [
  { label: 'Dashboard', href: '/membership' },
  { label: 'Collections', href: '/membership/collections' },
  { label: 'Events', href: '/membership/events' },
  { label: 'Community', href: '/membership/community' },
  { label: 'Benefits', href: '/membership/benefits' },
]

type Event = {
  id: string
  title: string
  description: string | null
  image: string | null
    location: string | null
  meetingUrl: string | null
  eventDate: string

  capacity: number | null
  rsvpCount: number
  isRegistered: boolean
}

export default function MembershipEventsClient({ events = [] }: { events: Event[] }) {
  const [localEvents, setLocalEvents] = useState(events)
  const [isPending, startTransition] = useTransition()

  function handleToggleRsvp(event: Event) {
    startTransition(async () => {
      const res = event.isRegistered ? await cancelRsvp(event.id) : await rsvpToEvent(event.id)
      if (res.success) {
        setLocalEvents((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? {
                  ...e,
                  isRegistered: !e.isRegistered,
                  rsvpCount: e.rsvpCount + (e.isRegistered ? -1 : 1),
                }
              : e,
          ),
        )
      }
    })
  }

  return (
    <PortalLayout portalName="VIP Membership" portalSlug="membership" navItems={membershipNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Member Events</h1>
          <p className="text-muted-foreground">Exclusive showings, masterclasses, and gatherings.</p>
        </div>

        <div className="grid gap-6">
          {localEvents.map((event) => {
            const full = event.capacity ? event.rsvpCount >= event.capacity : false

            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {event.image && (
                    <Image src={event.image} alt="" width={640} height={360} unoptimized className="h-48 w-full object-cover md:w-64" />
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <h3 className="font-serif text-xl font-light text-foreground">{event.title}</h3>
                      {event.isRegistered && <Badge className="bg-emerald-600">Registered</Badge>}
                    </div>

                    {event.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.eventDate).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                      {event.capacity && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {event.rsvpCount}/{event.capacity} attending
                        </span>
                      )}
                    </div>

                                        {event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-primary underline">Join Google Meet</a>}
                    <Button
                      className="mt-4 rounded-none"

                      disabled={isPending || (full && !event.isRegistered)}
                      variant={event.isRegistered ? 'outline' : 'default'}
                      onClick={() => handleToggleRsvp(event)}
                    >
                      {event.isRegistered ? 'Cancel RSVP' : full ? 'Event Full' : 'RSVP'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}

          {localEvents.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <Calendar className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}