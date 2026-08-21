import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { consultations } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import ConsultationsClient from './consultations-client'

export const dynamic = 'force-dynamic'

export default async function ClientConsultations() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/consultations',
  )

  const myConsultations = await db
    .select()
    .from(consultations)
    .where(eq(consultations.userId, user.id))
    .orderBy(desc(consultations.createdAt))

  const formatted = myConsultations.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    preferredDate: c.preferredDate ? c.preferredDate.toISOString() : null,
  }))

  return <ConsultationsClient consultations={formatted} />
}
