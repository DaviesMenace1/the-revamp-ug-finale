import { db } from '@/lib/db/client'
import { consultationSlots } from '@/lib/db/schema'
import { eq, and, gte, asc } from 'drizzle-orm'
import BookConsultationClient from './book-consultation-client'

export const dynamic = 'force-dynamic'

export default async function BookConsultationPage() {
  const slots = await db
    .select()
    .from(consultationSlots)
    .where(and(eq(consultationSlots.isBooked, false), gte(consultationSlots.startTime, new Date())))
    .orderBy(asc(consultationSlots.startTime))

  const formatted = slots.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    durationMinutes: s.durationMinutes,
    mode: s.mode,
  }))

  return <BookConsultationClient slots={formatted} />
}