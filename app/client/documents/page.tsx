import { db } from '@/lib/db/client'
import { clientDocuments, financialDocuments, invoices, quotes } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import DocumentsClient from './documents-client'
import { safeQuery } from '@/lib/server/safe-query'
import { requirePortalUser } from '@/lib/auth/portal-auth'

export const dynamic = 'force-dynamic'

export default async function ClientDocuments() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/documents',
  )

  const [sharedResult, financialResult, quoteResult, invoiceResult] = await Promise.all([
    safeQuery(
      db
        .select({ id: clientDocuments.id, name: clientDocuments.name, category: clientDocuments.category, fileUrl: clientDocuments.fileUrl, createdAt: clientDocuments.createdAt })
        .from(clientDocuments)
        .where(eq(clientDocuments.userId, user.id))
        .orderBy(desc(clientDocuments.createdAt))
        .limit(100),
      'client documents',
      [],
    ),
    safeQuery(
      db
        .select({ id: financialDocuments.id, name: financialDocuments.documentNumber, category: financialDocuments.documentType, fileUrl: financialDocuments.fileUrl, currency: financialDocuments.currency, amount: financialDocuments.amount, createdAt: financialDocuments.createdAt })
        .from(financialDocuments)
        .where(eq(financialDocuments.userId, user.id))
        .orderBy(desc(financialDocuments.createdAt))
        .limit(100),
      'client financial documents',
      [],
    ),
    safeQuery(
      db
        .select({ id: quotes.id, name: quotes.quoteNumber, fileUrl: quotes.pdfUrl, total: quotes.total, createdAt: quotes.createdAt })
        .from(quotes)
        .where(eq(quotes.userId, user.id))
        .orderBy(desc(quotes.createdAt))
        .limit(100),
      'client quotes',
      [],
    ),
    safeQuery(
      db
        .select({ id: invoices.id, name: invoices.invoiceNumber, fileUrl: invoices.pdfUrl, receiptUrl: invoices.receiptUrl, total: invoices.total, createdAt: invoices.createdAt })
        .from(invoices)
        .where(eq(invoices.userId, user.id))
        .orderBy(desc(invoices.createdAt))
        .limit(100),
      'client invoices',
      [],
    ),
  ])

  const sharedDocuments = sharedResult.data.map((document) => ({
    id: `shared-${document.id}`,
    name: document.name,
    category: document.category || 'Shared file',
    fileUrl: document.fileUrl,
    createdAt: new Date(document.createdAt).toISOString(),
  }))
  const generatedDocuments = financialResult.data
    .filter((document) => Boolean(document.fileUrl))
    .map((document) => ({
      id: `financial-${document.id}`,
      name: document.name,
      category: `${document.category.replace(/_/g, ' ')} · ${document.currency}`,
      fileUrl: document.fileUrl as string,
      createdAt: new Date(document.createdAt).toISOString(),
    }))
  const quoteDocuments = quoteResult.data
    .filter((document) => Boolean(document.fileUrl))
    .map((document) => ({
      id: `quote-${document.id}`,
      name: document.name,
      category: `Quote · UGX ${Number(document.total || 0).toLocaleString('en-UG')}`,
      fileUrl: document.fileUrl as string,
      createdAt: new Date(document.createdAt).toISOString(),
    }))
  const invoiceDocuments = invoiceResult.data.flatMap((document) => [
    document.fileUrl ? { id: `invoice-${document.id}`, name: document.name, category: `Invoice · UGX ${Number(document.total || 0).toLocaleString('en-UG')}`, fileUrl: document.fileUrl, createdAt: new Date(document.createdAt).toISOString() } : null,
    document.receiptUrl ? { id: `receipt-${document.id}`, name: `${document.name} receipt`, category: `Payment receipt · UGX ${Number(document.total || 0).toLocaleString('en-UG')}`, fileUrl: document.receiptUrl, createdAt: new Date(document.createdAt).toISOString() } : null,
  ].filter((document): document is { id: string; name: string; category: string; fileUrl: string; createdAt: string } => Boolean(document)))

  const documents = [...sharedDocuments, ...generatedDocuments, ...quoteDocuments, ...invoiceDocuments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const failed = [sharedResult, financialResult, quoteResult, invoiceResult].some((result) => result.error)

  return <DocumentsClient documents={documents} loadError={failed ? 'Some document sources are temporarily unavailable. Available records are still shown; retry to refresh.' : null} />
}
