'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, MapPin, Users } from '@/components/ui/luxury-icons'
import { rsvpToEvent, cancelRsvp } from '@/lib/actions/events'
import { membershipNavItems } from '@/components/portals/portal-navigation'

type Event = { id: string; title: string; description: string | null; image: string | null; location: string | null; meetingUrl: string | null; eventDate: string; capacity: number | null; rsvpCount: number; isRegistered: boolean }

export default function MembershipEventsClient({ events = [] }: { events: Event[] }) {
  const [localEvents, setLocalEvents] = useState(events)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  function handleToggleRsvp(event: Event) {
    setPendingId(event.id)
    setErrors((current) => ({ ...current, [event.id]: '' }))
    startTransition(async () => {
      const result = event.isRegistered ? await cancelRsvp(event.id) : await rsvpToEvent(event.id)
      if (!result.success) setErrors((current) => ({ ...current, [event.id]: result.error || 'The RSVP could not be updated.' }))
      else setLocalEvents((current) => current.map((item) => item.id === event.id ? { ...item, isRegistered: !item.isRegistered, rsvpCount: item.rsvpCount + (item.isRegistered ? -1 : 1) } : item))
      setPendingId(null)
    })
  }

  return <PortalLayout portalName="Revamp Membership" portalSlug="membership" navItems={[...membershipNavItems]}><div className="space-y-10"><header className="max-w-3xl space-y-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Membership calendar</p><h1 className="font-serif text-4xl font-light leading-[1.04] text-foreground md:text-6xl">Invitations to make room for.</h1><p className="text-base leading-7 text-muted-foreground">Showings, conversations, and studio gatherings for the membership community.</p></header><div className="grid gap-6">{localEvents.map((event) => { const full = event.capacity !== null && event.rsvpCount >= event.capacity; return <Card key={event.id} className="overflow-hidden border-border/70"> <div className="flex flex-col md:flex-row">{event.image && <Image src={event.image} alt={event.title} width={640} height={360} unoptimized className="h-52 w-full object-cover md:w-72" />}<div className="flex-1 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-serif text-2xl font-light text-foreground">{event.title}</h2>{event.isRegistered && <Badge className="bg-emerald-600">Reserved</Badge>}</div>{event.description && <p className="mt-3 text-sm leading-7 text-muted-foreground">{event.description}</p>}<div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Calendar className="size-4 text-primary" />{new Date(event.eventDate).toLocaleString('en-UG', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</span>{event.location && <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{event.location}</span>}{event.capacity !== null && <span className="flex items-center gap-1.5"><Users className="size-4 text-primary" />{event.rsvpCount}/{event.capacity} places</span>}</div>{event.isRegistered && event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-medium text-primary underline underline-offset-4">Open event link</a>}{errors[event.id] && <p role="alert" className="mt-4 text-sm text-destructive">{errors[event.id]}</p>}<Button className="mt-5 min-h-11 rounded-none" disabled={pendingId === event.id || (full && !event.isRegistered)} variant={event.isRegistered ? 'outline' : 'default'} onClick={() => handleToggleRsvp(event)}>{pendingId === event.id ? 'Updating...' : event.isRegistered ? 'Cancel reservation' : full ? 'Event full' : 'Reserve a place'}</Button></div></div></Card> })}{localEvents.length === 0 && <div className="flex flex-col items-center rounded-xl border border-dashed border-border/50 p-12 text-center"><Calendar className="mb-3 size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">No upcoming invitations are scheduled.</p><p className="mt-2 text-xs text-muted-foreground/70">New gatherings will appear here when the studio publishes them.</p></div>}</div></div></PortalLayout>
}
