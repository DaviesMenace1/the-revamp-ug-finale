import { db } from '@/lib/db/client'
import { consultationSlots } from '@/lib/db/schema'
import { eq, and, gte, asc, isNull, lt, or } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import BookConsultationClient from './book-consultation-client'

export const dynamic = 'force-dynamic'

async function getAvailableConsultationSlots() {
  return db
    .select({ id: consultationSlots.id, startTime: consultationSlots.startTime, durationMinutes: consultationSlots.durationMinutes, mode: consultationSlots.mode })
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
  }))

  return <BookConsultationClient slots={formatted} loadError={result.error} />
}
