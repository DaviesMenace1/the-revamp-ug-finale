import { db } from '@/lib/db/client'
import { quotes, invoices, users, projects } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import BillingAdminClient from './billing-admin-client'

export const dynamic = 'force-dynamic'

export default async function AdminBillingPage() {
  const [quoteRows, invoiceRows, clients, clientProjects] = await Promise.all([
    db
      .select({
        id: quotes.id,
        quoteNumber: quotes.quoteNumber,
        total: quotes.total,
        status: quotes.status,
        pdfUrl: quotes.pdfUrl,
        validUntil: quotes.validUntil,
        createdAt: quotes.createdAt,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        clientEmail: users.email,
      })
      .from(quotes)
      .innerJoin(users, eq(quotes.userId, users.id))
      .orderBy(desc(quotes.createdAt)),
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
        pdfUrl: invoices.pdfUrl,
        receiptUrl: invoices.receiptUrl,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        clientEmail: users.email,
      })
      .from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .orderBy(desc(invoices.createdAt)),
    db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).orderBy(users.email),
    db
      .select({ id: projects.id, title: projects.title, userId: projects.userId })
      .from(projects)
      .where(eq(projects.projectKind, 'client')),
  ])

  return (
    <BillingAdminClient
      quotes={quoteRows.map((q) => ({ ...q, createdAt: q.createdAt.toISOString(), validUntil: q.validUntil ? q.validUntil.toISOString() : null }))}
      invoices={invoiceRows.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), dueDate: i.dueDate ? i.dueDate.toISOString() : null }))}
      clients={clients}
      projects={clientProjects}
    />
  )
}