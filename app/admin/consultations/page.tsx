import { db } from '@/lib/db/client'
import { consultations, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
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

  const formatted = rows.map((row) => ({
    ...row,
    preferredDate: row.preferredDate ? row.preferredDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }))

  return <ConsultationsClient initialConsultations={formatted} />
}

