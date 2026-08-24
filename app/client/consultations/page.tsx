import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { consultations } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import ConsultationsClient from './consultations-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientConsultations() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/consultations',
  )

  const result = await safeQuery(
    db
      .select({
        id: consultations.id,
        title: consultations.title,
        description: consultations.description,
        serviceType: consultations.serviceType,
        status: consultations.status,
        preferredDate: consultations.preferredDate,
        mode: consultations.mode,
        durationMinutes: consultations.durationMinutes,
        meetingLink: consultations.meetingLink,
        location: consultations.location,
        notes: consultations.notes,
        createdAt: consultations.createdAt,
        updatedAt: consultations.updatedAt,
      })
      .from(consultations)
      .where(eq(consultations.userId, user.id))
      .orderBy(desc(consultations.createdAt)),
    'client consultations',
    [],
  )

  const formatted = result.data.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    preferredDate: c.preferredDate ? c.preferredDate.toISOString() : null,
  }))

  return <ConsultationsClient consultations={formatted} loadError={result.error ? 'Consultations are temporarily unavailable. You can retry the page.' : null} />
}
