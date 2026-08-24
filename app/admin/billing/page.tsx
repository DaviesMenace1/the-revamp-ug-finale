import { db } from '@/lib/db/client'
import { quotes, invoices, users, projects, financialDocuments } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import BillingAdminClient from './billing-admin-client'
import { safeQuery } from '@/lib/server/safe-query'
import { isR2Configured } from '@/lib/storage/r2'

export const dynamic = 'force-dynamic'

export default async function AdminBillingPage() {
  // Load the client selector independently. With one Supavisor connection per
  // serverless instance, firing five uncancelled requests together can queue
  // the selector behind a slow report and make every form look empty.
  const clientResult = await safeQuery(
    db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .orderBy(users.email)
      .limit(200),
    'clients',
    [],
    4500,
  )

  const quoteResult = await safeQuery(
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
      .orderBy(desc(quotes.createdAt))
      .limit(100),
    'quotes',
    [],
  )

  const invoiceResult = await safeQuery(
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
      .orderBy(desc(invoices.createdAt))
      .limit(100),
    'invoices',
    [],
  )

  const projectResult = await safeQuery(
    db
      .select({ id: projects.id, title: projects.title, userId: projects.userId })
      .from(projects)
      .where(eq(projects.projectKind, 'client'))
      .limit(200),
    'projects',
    [],
  )

  const generatedResult = await safeQuery(
    db
      .select({
        id: financialDocuments.id,
        documentNumber: financialDocuments.documentNumber,
        documentType: financialDocuments.documentType,
        amount: financialDocuments.amount,
        currency: financialDocuments.currency,
        fileUrl: financialDocuments.fileUrl,
        createdAt: financialDocuments.createdAt,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        clientEmail: users.email,
      })
      .from(financialDocuments)
      .innerJoin(users, eq(financialDocuments.userId, users.id))
      .orderBy(desc(financialDocuments.createdAt))
      .limit(100),
    'generated documents',
    [],
  )

  const quoteRows = quoteResult.data ?? []
  const invoiceRows = invoiceResult.data ?? []
  const clients = clientResult.data ?? []
  const clientProjects = projectResult.data ?? []
  const generatedDocuments = generatedResult.data ?? []
  const failedQueries = [quoteResult, invoiceResult, clientResult, projectResult, generatedResult]
    .filter((result) => result.error)
    .map((result) => result.error)

  return (
    <BillingAdminClient
      quotes={quoteRows.map((q) => ({
        ...q,
        createdAt: new Date(q.createdAt).toISOString(),
        validUntil: q.validUntil ? new Date(q.validUntil).toISOString() : null,
      }))}
      invoices={invoiceRows.map((i) => ({
        ...i,
        createdAt: new Date(i.createdAt).toISOString(),
        dueDate: i.dueDate ? new Date(i.dueDate).toISOString() : null,
      }))}
      clients={clients}
      projects={clientProjects}
      documents={generatedDocuments.map((document) => ({
        ...document,
        createdAt: new Date(document.createdAt).toISOString(),
      }))}
      storageConfigured={isR2Configured()}
      loadError={failedQueries.length > 0 ? 'Some billing data could not be loaded. You can still use the available sections and retry the page.' : null}
    />
  )
}
