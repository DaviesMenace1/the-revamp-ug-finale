import { db } from '@/lib/db/client'
import { consultationSlots, consultations, users } from '@/lib/db/schema'
import { asc, desc, eq, gte } from 'drizzle-orm'
import ConsultationsClient from './consultations-client'

export const dynamic = 'force-dynamic'

export default async function AdminConsultationsPage() {
  const rows = await db
    .select({
      id: consultations.id,
      title: consultations.title,
      description: consultations.description,
      serviceType: consultations.serviceType,
      budget: consultations.budget,
      preferredDate: consultations.preferredDate,
      status: consultations.status,
      notes: consultations.notes,
      createdAt: consultations.createdAt,
      clientEmail: users.email,
      clientFirstName: users.firstName,
      clientLastName: users.lastName,
      clientPhone: users.phone,
    })
    .from(consultations)
    .leftJoin(users, eq(consultations.userId, users.id))
    .orderBy(desc(consultations.createdAt))

  const slots = await db
    .select({
      id: consultationSlots.id,
      startTime: consultationSlots.startTime,
      durationMinutes: consultationSlots.durationMinutes,
      mode: consultationSlots.mode,
      isBooked: consultationSlots.isBooked,
      consultationId: consultationSlots.consultationId,
    })
    .from(consultationSlots)
    .where(gte(consultationSlots.startTime, new Date()))
    .orderBy(asc(consultationSlots.startTime))
    .limit(100)

  const formatted = rows.map((row) => ({
    ...row,
    preferredDate: row.preferredDate ? row.preferredDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }))
  const formattedSlots = slots.map((slot) => ({ ...slot, startTime: slot.startTime.toISOString() }))

  return <ConsultationsClient initialConsultations={formatted} initialSlots={formattedSlots} />
}

