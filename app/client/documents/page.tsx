import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { clientDocuments } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import DocumentsClient from './documents-client'

export const dynamic = 'force-dynamic'

export default async function ClientDocuments() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/documents',
  )

  const documents = await db
    .select()
    .from(clientDocuments)
    .where(eq(clientDocuments.userId, user.id))
    .orderBy(desc(clientDocuments.createdAt))

  const formatted = documents.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }))

  return <DocumentsClient documents={formatted} />
}

