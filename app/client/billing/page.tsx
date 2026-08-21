import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { quotes, invoices } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import BillingClientView from './billing-client-view'

export const dynamic = 'force-dynamic'

export default async function ClientBillingPage() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/billing',
  )

  // Every query here is filtered to this user's id — a client only ever
  // sees their own quotes, invoices, and receipts, never another client's.
  const [myQuotes, myInvoices] = await Promise.all([
    db.select().from(quotes).where(eq(quotes.userId, user.id)).orderBy(desc(quotes.createdAt)),
    db.select().from(invoices).where(eq(invoices.userId, user.id)).orderBy(desc(invoices.createdAt)),
  ])

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
    />
  )
}
