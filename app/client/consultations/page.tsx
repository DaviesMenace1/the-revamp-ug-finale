import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { consultations, financialDocuments } from '@/lib/db/schema'
import { and, eq, desc, inArray } from 'drizzle-orm'
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
        paymentStatus: consultations.paymentStatus,
        paymentAmount: consultations.paymentAmount,
        paymentCurrency: consultations.paymentCurrency,
        paymentReference: consultations.paymentReference,
        discountAmount: consultations.discountAmount,
        taxAmount: consultations.taxAmount,
        promotionCode: consultations.promotionCode,
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

  const consultationIds = result.data.map((consultation) => consultation.id)
  const documents = consultationIds.length > 0
    ? await db
        .select({ consultationId: financialDocuments.consultationId, documentNumber: financialDocuments.documentNumber, documentType: financialDocuments.documentType, fileUrl: financialDocuments.fileUrl })
        .from(financialDocuments)
        .where(and(eq(financialDocuments.userId, user.id), inArray(financialDocuments.consultationId, consultationIds)))
        .orderBy(desc(financialDocuments.createdAt))
    : []

  const formatted = result.data.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    preferredDate: c.preferredDate ? c.preferredDate.toISOString() : null,
    documents: documents.filter((document) => document.consultationId === c.id),
  }))

  return <ConsultationsClient consultations={formatted} loadError={result.error ? 'Consultations are temporarily unavailable. You can retry the page.' : null} />
}
