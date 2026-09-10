import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { consultationSlots } from '@/lib/db/schema'
import { eq, and, gte, asc, isNull, lt, or } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import BookConsultationClient from './book-consultation-client'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Book an Interior Design or Architecture Consultation | The Revamp UG',
  description: 'Book a consultation with The Revamp UG to discuss interior design, architecture, furniture sourcing, renovation, or a commercial and hospitality project in Uganda.',
  keywords: ['interior design consultation Uganda', 'architecture consultation Kampala', 'furniture sourcing consultation', 'The Revamp UG booking'],
  alternates: { canonical: `${SITE_URL}/book-consultation` },
  openGraph: { type: 'website', url: `${SITE_URL}/book-consultation`, title: 'Book a Design Consultation | The Revamp UG', description: 'Start a focused conversation about your space, project, or furniture needs.' },
  twitter: { card: 'summary_large_image', title: 'Book a Design Consultation | The Revamp UG', description: 'Start a focused conversation about your space, project, or furniture needs.' },
}

async function getAvailableConsultationSlots() {
  return db
    .select({ id: consultationSlots.id, startTime: consultationSlots.startTime, durationMinutes: consultationSlots.durationMinutes, mode: consultationSlots.mode, location: consultationSlots.location, meetingUrl: consultationSlots.meetingUrl })
    .from(consultationSlots)
    .where(and(eq(consultationSlots.isBooked, false), gte(consultationSlots.startTime, new Date()), or(isNull(consultationSlots.holdUntil), lt(consultationSlots.holdUntil, new Date()))))
    .orderBy(asc(consultationSlots.startTime))
    .limit(100)
}

export default async function BookConsultationPage() {
  const result = await safeQuery(getAvailableConsultationSlots(), 'consultation availability', [])
  const formatted = result.data.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime.toISOString(),
    durationMinutes: slot.durationMinutes,
    mode: slot.mode,
    location: slot.location,
    meetingUrl: slot.meetingUrl,
  }))

  return <BookConsultationClient slots={formatted} loadError={result.error} />
}
