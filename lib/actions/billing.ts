'use server'

import { randomInt } from 'node:crypto'
import { db } from '@/lib/db/client'
import {
  financialDocuments,
  invoices,
  projectActivity,
  projects,
  quotes,
  users,
} from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { uploadClientDocToR2, isR2Configured } from '@/lib/storage/r2'
import { getCompanyProfile } from '@/lib/documents/company-profile'
import { renderFinancialDocument, type FinancialDocumentLine } from '@/lib/documents/pdf'
import { notifyUser } from '@/lib/notifications/service'

const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024
const ALLOWED_UPLOAD_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
const QUOTE_STATUSES = new Set(['pending', 'accepted', 'expired', 'cancelled'])
const GENERATED_DOCUMENT_TYPES = new Set(['quote', 'proforma_invoice', 'invoice', 'receipt', 'payment_receipt', 'estimate'])

async function getAdmin() {
  const result = await getCurrentUserWithRole(['admin'])
  return result.authorized ? result.user : null
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key)
  return value || null
}

function validateUpload(file: File | null) {
  if (!file || file.size <= 0) return 'A document file is required.'
  if (file.size > MAX_DOCUMENT_BYTES) return 'Documents must be 12 MB or smaller.'
  if (file.type && !ALLOWED_UPLOAD_TYPES.has(file.type)) return 'Upload a PDF, PNG, JPG, or WebP document.'
  return null
}

function generateNumber(prefix: string) {
  const year = new Date().getUTCFullYear()
  return `RV-${prefix}-${year}-${Date.now().toString(36).toUpperCase()}${randomInt(100, 1000)}`
}

async function recordProjectActivity(projectId: string | null, adminId: string, action: string, summary: string) {
  if (!projectId) return
  await db.insert(projectActivity).values({
    projectId,
    actorUserId: adminId,
    actorType: 'admin',
    action,
    summary,
  })
}

async function validateClientAndProject(userId: string, projectId: string | null) {
  const client = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, firstName: true, lastName: true, email: true },
  })
  if (!client) return { client: null, project: null }

  const project = projectId
    ? await db.query.projects.findFirst({
        where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
        columns: { id: true, title: true },
      })
    : null
  if (projectId && !project) return { client: null, project: null }
  return { client, project }
}

// Manual uploads remain supported for documents produced outside the app.
export async function createQuote(formData: FormData) {
  const admin = await getAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage billing.' }
  if (!isR2Configured()) return { success: false, error: 'Cloudflare R2 is not configured.' }

  const userId = readText(formData, 'userId')
  const projectId = readOptionalText(formData, 'projectId')
  const total = readText(formData, 'total')
  const validUntil = readOptionalText(formData, 'validUntil')
  const notes = readOptionalText(formData, 'notes')
  const file = formData.get('file') as File | null
  const fileError = validateUpload(file)
  if (!userId || !total || fileError) return { success: false, error: fileError || 'Client and total amount are required.' }
  if (!file) return { success: false, error: 'A document file is required.' }
  if (!Number.isFinite(Number(total)) || Number(total) < 0) return { success: false, error: 'Enter a valid non-negative total.' }
  const { client, project } = await validateClientAndProject(userId, projectId)
  if (!client || (projectId && !project)) return { success: false, error: 'Select a valid client and that client’s project.' }

  try {
    const upload = await uploadClientDocToR2(Buffer.from(await file.arrayBuffer()), {
      userId,
      category: 'quotes',
      filename: file.name,
      contentType: file.type || 'application/pdf',
    })
    const quoteNumber = generateNumber('Q')
    const [quote] = await db.insert(quotes).values({
      quoteNumber,
      userId,
      projectId,
      pdfUrl: upload.url,
      total,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes,
    }).returning()
    await recordProjectActivity(projectId, admin.id, 'quote_uploaded', `Quote ${quote.quoteNumber} was uploaded`)
    void notifyUser({ userId, type: 'quote_ready', title: 'New quote available', message: `Quote ${quote.quoteNumber} is ready to review.`, actionUrl: '/client/billing', channels: ['in_app', 'push'] })
    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    return { success: true, quote }
  } catch (error) {
    console.error('Failed to create quote:', error)
    return { success: false, error: 'Failed to upload quote. Please try again.' }
  }
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const admin = await getAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage billing.' }
  if (!QUOTE_STATUSES.has(status)) return { success: false, error: 'Invalid quote status.' }
  try {
    await db.update(quotes).set({ status, updatedAt: new Date() }).where(eq(quotes.id, quoteId))
    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    return { success: true }
  } catch (error) {
    console.error('Failed to update quote status:', error)
    return { success: false, error: 'Failed to update quote.' }
  }
}

export async function createInvoice(formData: FormData) {
  const admin = await getAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage billing.' }
  if (!isR2Configured()) return { success: false, error: 'Cloudflare R2 is not configured.' }

  const userId = readText(formData, 'userId')
  const projectId = readOptionalText(formData, 'projectId')
  const total = readText(formData, 'total')
  const dueDate = readOptionalText(formData, 'dueDate')
  const notes = readOptionalText(formData, 'notes')
  const file = formData.get('file') as File | null
  const fileError = validateUpload(file)
  if (!userId || !total || fileError) return { success: false, error: fileError || 'Client and total amount are required.' }
  if (!file) return { success: false, error: 'A document file is required.' }
  if (!Number.isFinite(Number(total)) || Number(total) < 0) return { success: false, error: 'Enter a valid non-negative total.' }
  const { client, project } = await validateClientAndProject(userId, projectId)
  if (!client || (projectId && !project)) return { success: false, error: 'Select a valid client and that client’s project.' }

  try {
    const upload = await uploadClientDocToR2(Buffer.from(await file.arrayBuffer()), {
      userId,
      category: 'invoices',
      filename: file.name,
      contentType: file.type || 'application/pdf',
    })
    const invoiceNumber = generateNumber('INV')
    const [invoice] = await db.insert(invoices).values({
      invoiceNumber,
      userId,
      projectId,
      pdfUrl: upload.url,
      total,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'sent',
      notes,
    }).returning()
    await recordProjectActivity(projectId, admin.id, 'invoice_uploaded', `Invoice ${invoice.invoiceNumber} was uploaded`)
    void notifyUser({ userId, type: 'invoice_ready', title: 'New invoice available', message: `Invoice ${invoice.invoiceNumber} is ready to review.`, actionUrl: '/client/billing', channels: ['in_app', 'push'] })
    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    return { success: true, invoice }
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return { success: false, error: 'Failed to upload invoice. Please try again.' }
  }
}

export async function uploadReceipt(formData: FormData) {
  const admin = await getAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage billing.' }
  if (!isR2Configured()) return { success: false, error: 'Cloudflare R2 is not configured.' }

  const invoiceId = readText(formData, 'invoiceId')
  const amountPaidInput = readOptionalText(formData, 'amountPaid')
  const file = formData.get('file') as File | null
  const fileError = validateUpload(file)
  if (!invoiceId || fileError) return { success: false, error: fileError || 'Invoice and receipt file are required.' }
  if (!file) return { success: false, error: 'A receipt file is required.' }

  try {
    const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) })
    if (!invoice) return { success: false, error: 'Invoice not found.' }
    const amountPaid = amountPaidInput ? Number(amountPaidInput) : Number(invoice.total)
    if (!Number.isFinite(amountPaid) || amountPaid < 0) return { success: false, error: 'Enter a valid paid amount.' }
    const upload = await uploadClientDocToR2(Buffer.from(await file.arrayBuffer()), {
      userId: invoice.userId,
      category: 'receipts',
      filename: file.name,
      contentType: file.type || 'application/pdf',
    })
    const status = amountPaid >= Number(invoice.total) ? 'paid' : 'partial'
    await db.update(invoices).set({
      receiptUrl: upload.url,
      receiptUploadedAt: new Date(),
      amountPaid: String(amountPaid),
      status,
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId))
    await recordProjectActivity(invoice.projectId, admin.id, 'payment_recorded', `Receipt uploaded for invoice ${invoice.invoiceNumber}`)
    void notifyUser({ userId: invoice.userId, type: 'receipt_ready', title: 'Payment receipt available', message: `A receipt for invoice ${invoice.invoiceNumber} is now available.`, actionUrl: '/client/billing', channels: ['in_app', 'push'] })
    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    return { success: true }
  } catch (error) {
    console.error('Failed to upload receipt:', error)
    return { success: false, error: 'Failed to upload receipt. Please try again.' }
  }
}

function parseItems(formData: FormData): FinancialDocumentLine[] {
  const raw = readText(formData, 'items')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const items = parsed
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            description: typeof item.description === 'string' ? item.description.slice(0, 200) : 'Professional service',
            quantity: Math.max(0, Number(item.quantity) || 0),
            unitPrice: Math.max(0, Number(item.unitPrice) || 0),
          }))
          .filter((item) => item.description && item.quantity > 0)
        if (items.length) return items.slice(0, 30)
      }
    } catch {
      // Fall through to the single-line builder fields.
    }
  }
  return [{
    description: readText(formData, 'description') || 'Professional design service',
    quantity: Math.max(1, Number(readText(formData, 'quantity')) || 1),
    unitPrice: Math.max(0, Number(readText(formData, 'unitPrice') || readText(formData, 'total')) || 0),
  }]
}

export async function createGeneratedFinancialDocument(formData: FormData) {
  const admin = await getAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage billing.' }
  if (!isR2Configured()) return { success: false, error: 'Cloudflare R2 is not configured.' }

  const documentType = readText(formData, 'documentType')
  const userId = readText(formData, 'userId')
  const projectId = readOptionalText(formData, 'projectId')
  if (!GENERATED_DOCUMENT_TYPES.has(documentType)) return { success: false, error: 'Choose a valid document type.' }
  if (!userId) return { success: false, error: 'Select a client.' }

  try {
    const { client, project } = await validateClientAndProject(userId, projectId)
    if (!client || (projectId && !project)) return { success: false, error: 'Select a valid client and that client’s project.' }

    const items = parseItems(formData)
    const taxRate = Math.max(0, Number(readText(formData, 'taxRate')) || 0)
    const discount = Math.max(0, Number(readText(formData, 'discount')) || 0)
    const total = Math.max(0, items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - discount)
    const profile = await getCompanyProfile()
    const documentNumber = generateNumber(
      documentType === 'quote' ? 'Q' : documentType === 'invoice' ? 'INV' : documentType === 'receipt' || documentType === 'payment_receipt' ? 'RCPT' : 'PRO',
    )
    const dueDate = readOptionalText(formData, 'dueDate')
    const validUntil = readOptionalText(formData, 'validUntil')
    const pdf = await renderFinancialDocument({
      documentType,
      documentNumber,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      clientName: `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || client.email,
      clientEmail: client.email,
      projectName: project?.title,
      currency: 'UGX',
      items,
      taxRate,
      discount,
      notes: readOptionalText(formData, 'notes'),
      terms: readOptionalText(formData, 'terms'),
      paymentMethod: readOptionalText(formData, 'paymentMethod'),
    }, profile)
    const upload = await uploadClientDocToR2(pdf, {
      userId,
      category: `documents/${documentType}`,
      filename: `${documentNumber}.pdf`,
      contentType: 'application/pdf',
    })

    let quoteId: string | null = null
    let invoiceId: string | null = null
    const displayTotal = String(total + (total * taxRate) / 100)
    if (documentType === 'quote') {
      const [quote] = await db.insert(quotes).values({
        quoteNumber: documentNumber,
        userId,
        projectId,
        pdfUrl: upload.url,
        total: displayTotal,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: readOptionalText(formData, 'notes'),
      }).returning({ id: quotes.id })
      quoteId = quote.id
    }
    if (documentType === 'invoice') {
      const [invoice] = await db.insert(invoices).values({
        invoiceNumber: documentNumber,
        userId,
        projectId,
        pdfUrl: upload.url,
        total: displayTotal,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'sent',
        notes: readOptionalText(formData, 'notes'),
      }).returning({ id: invoices.id })
      invoiceId = invoice.id
    }

    const [document] = await db.insert(financialDocuments).values({
      documentNumber,
      documentType,
      userId,
      projectId,
      quoteId,
      invoiceId,
      status: 'issued',
      amount: displayTotal,
      currency: 'UGX',
      storageProvider: 'r2',
      storageKey: upload.key,
      fileUrl: upload.url,
      fileName: `${documentNumber}.pdf`,
      mimeType: 'application/pdf',
      fileSize: upload.size,
      payload: { items, taxRate, discount, notes: readOptionalText(formData, 'notes'), terms: readOptionalText(formData, 'terms') },
      createdBy: admin.id,
    }).returning({ id: financialDocuments.id, documentNumber: financialDocuments.documentNumber, documentType: financialDocuments.documentType, fileUrl: financialDocuments.fileUrl, amount: financialDocuments.amount, createdAt: financialDocuments.createdAt })

    await recordProjectActivity(projectId, admin.id, 'financial_document_created', `${documentNumber} was generated`)
    void notifyUser({ userId, type: 'financial_document_ready', title: 'New financial document available', message: `${documentNumber} is ready to review.`, actionUrl: '/client/billing', channels: ['in_app', 'push'] })
    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    if (projectId) revalidatePath(`/admin/client-projects/${projectId}`)
    return { success: true, document }
  } catch (error) {
    console.error('Failed to generate financial document:', error)
    return { success: false, error: 'Failed to generate the document. Please check the fields and try again.' }
  }
}

export async function listGeneratedFinancialDocuments() {
  const admin = await getAdmin()
  if (!admin) return []
  return db
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
    .limit(100)
}
