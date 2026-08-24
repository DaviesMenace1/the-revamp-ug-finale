import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { quotes, invoices, financialDocuments } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import BillingClientView from './billing-client-view'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientBillingPage() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/billing',
  )

  const [quoteResult, invoiceResult, documentResult] = await Promise.all([
    safeQuery(db.select().from(quotes).where(eq(quotes.userId, user.id)).orderBy(desc(quotes.createdAt)).limit(100), 'quotes', []),
    safeQuery(db.select().from(invoices).where(eq(invoices.userId, user.id)).orderBy(desc(invoices.createdAt)).limit(100), 'invoices', []),
    safeQuery(
      db.select({ id: financialDocuments.id, documentNumber: financialDocuments.documentNumber, documentType: financialDocuments.documentType, amount: financialDocuments.amount, currency: financialDocuments.currency, fileUrl: financialDocuments.fileUrl, createdAt: financialDocuments.createdAt }).from(financialDocuments).where(eq(financialDocuments.userId, user.id)).orderBy(desc(financialDocuments.createdAt)).limit(100),
      'generated documents',
      [],
    ),
  ])

  const myQuotes = quoteResult.data ?? []
  const myInvoices = invoiceResult.data ?? []
  const myDocuments = documentResult.data ?? []
  const failed = [quoteResult, invoiceResult, documentResult].some((result) => result.error)

  return (
    <BillingClientView
      quotes={myQuotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        total: q.total,
        status: q.status,
        pdfUrl: q.pdfUrl,
        validUntil: q.validUntil ? q.validUntil.toISOString() : null,
        createdAt: q.createdAt.toISOString(),
      }))}
      documents={myDocuments.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
      }))}
      invoices={myInvoices.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        total: i.total,
        amountPaid: i.amountPaid,
        status: i.status,
        pdfUrl: i.pdfUrl,
        receiptUrl: i.receiptUrl,
        dueDate: i.dueDate ? i.dueDate.toISOString() : null,
        createdAt: i.createdAt.toISOString(),
      }))}
      loadError={failed ? 'Some billing records are temporarily unavailable. The available records are still shown.' : null}
    />
  )
}
