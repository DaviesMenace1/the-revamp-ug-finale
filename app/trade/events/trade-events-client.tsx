'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { Calendar, MapPin, Users } from 'lucide-react'
import { rsvpToEvent, cancelRsvp } from '@/lib/actions/events'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const tradeNavItems = [
  { label: 'Dashboard', href: '/trade' },
  { label: 'Collections', href: '/trade/collections' },
  { label: 'Wholesale Pricing', href: '/trade/pricing' },
  { label: 'Events', href: '/trade/events' },
  { label: 'Orders', href: '/trade/orders' },
  { label: 'Resources', href: '/trade/resources' },
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

export default function TradeEventsClient({ events }: { events: Event[] }) {
  const [localEvents, setLocalEvents] = useState(events)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(event: Event) {
    setError(null)
    startTransition(async () => {
      const result = event.isRegistered ? await cancelRsvp(event.id) : await rsvpToEvent(event.id)
      if (!result.success) {
        setError(result.error || 'The RSVP could not be updated.')
        return
      }
      setLocalEvents((current) => current.map((item) => item.id === event.id ? { ...item, isRegistered: !item.isRegistered, rsvpCount: item.rsvpCount + (item.isRegistered ? -1 : 1) } : item))
    })
  }

  return <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={tradeNavItems}><div className="space-y-8"><header className="space-y-2"><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Trade programming</p><h1 className="font-serif text-4xl font-light text-foreground sm:text-5xl">Trade events</h1><p className="max-w-2xl text-sm leading-6 text-muted-foreground">Join product previews, sourcing sessions, and practical gatherings curated by The Revamp UG team.</p></header>{error && <p className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{error}</p>}<div className="grid gap-6">{localEvents.map((event) => { const full = event.capacity ? event.rsvpCount >= event.capacity : false; return <Card key={event.id} className="overflow-hidden border-border/20"><div className="flex flex-col md:flex-row">{event.image && <Image src={event.image} alt="" width={640} height={360} unoptimized className="h-48 w-full object-cover md:w-64" />}<div className="flex-1 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-serif text-2xl font-light text-foreground">{event.title}</h2>{event.isRegistered && <Badge className="bg-emerald-600">Registered</Badge>}</div>{event.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.description}</p>}<div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Calendar className="size-4" />{new Date(event.eventDate).toLocaleString('en-UG', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>{event.location && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{event.location}</span>}{event.capacity && <span className="flex items-center gap-1.5"><Users className="size-4" />{event.rsvpCount}/{event.capacity} attending</span>}</div>{event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-5 mr-4 inline-block text-sm font-medium text-primary underline">Join Google Meet</a>}<Button className="mt-5 min-h-11 rounded-none" disabled={isPending || (full && !event.isRegistered)} variant={event.isRegistered ? 'outline' : 'default'} onClick={() => toggle(event)}>{event.isRegistered ? 'Cancel RSVP' : full ? 'Event full' : 'RSVP'}</Button></div></div></Card> })}{localEvents.length === 0 && <div className="border border-dashed border-border/50 p-12 text-center text-sm text-muted-foreground">No trade events are scheduled yet. Check back after the studio publishes the next programme.</div>}</div></div></PortalLayout>
}
