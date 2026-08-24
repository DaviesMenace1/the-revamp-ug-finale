import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { clientDocuments } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import DocumentsClient from './documents-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientDocuments() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/documents',
  )

  const result = await safeQuery(
    db
      .select()
      .from(clientDocuments)
      .where(eq(clientDocuments.userId, user.id))
      .orderBy(desc(clientDocuments.createdAt)),
    'client documents',
    [],
  )

  const formatted = result.data.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }))

  return <DocumentsClient documents={formatted} loadError={result.error ? 'Documents are temporarily unavailable. You can retry the page.' : null} />
}

