'use server'

import { db } from '@/lib/db/client'
import { quotes, invoices, projectActivity } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { uploadClientDocToR2, isR2Configured } from '@/lib/storage/r2'

function generateNumber(prefix: string) {
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${rand}`
}

// Quotes, invoices, and receipts are uploaded documents drawn up outside the
// app (accounting software, etc) — not computed from line items in here.
// Each is stored in R2 under a folder scoped to the client account, and
// every read path below filters by userId so a client only ever sees their
// own documents.

// --- Quotes ---

export async function createQuote(formData: FormData) {
  if (!isR2Configured()) {
    return { success: false, error: 'Cloudflare R2 is not configured.' }
  }

  const userId = formData.get('userId') as string
  const projectId = (formData.get('projectId') as string) || null
  const total = formData.get('total') as string
  const validUntil = formData.get('validUntil') as string | null
  const notes = formData.get('notes') as string | null
  const file = formData.get('file') as File | null

  if (!userId || !total || !file) {
    return { success: false, error: 'Client, total amount, and file are required.' }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await uploadClientDocToR2(buffer, {
      userId,
      category: 'quotes',
      filename: file.name,
      contentType: file.type || 'application/pdf',
    })

    const [quote] = await db
      .insert(quotes)
      .values({
        quoteNumber: generateNumber('QT'),
        userId,
        projectId,
        pdfUrl: upload.url,
        total,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
      })
      .returning()

    if (projectId) {
      const admin = await getOrCreateCurrentUser()
      await db.insert(projectActivity).values({
        projectId,
        actorUserId: admin?.id || null,
        actorType: 'admin',
        action: 'quote_sent',
        summary: `Quote ${quote.quoteNumber} was sent`,
      })
      revalidatePath(`/admin/client-projects/${projectId}`)
    }

    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    return { success: true, quote }
  } catch (error) {
    console.error('Failed to create quote:', error)
    return { success: false, error: 'Failed to upload quote.' }
  }
}

export async function updateQuoteStatus(quoteId: string, status: string) {
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

// --- Invoices ---

export async function createInvoice(formData: FormData) {
  if (!isR2Configured()) {
    return { success: false, error: 'Cloudflare R2 is not configured.' }
  }

  const userId = formData.get('userId') as string
  const projectId = (formData.get('projectId') as string) || null
  const total = formData.get('total') as string
  const dueDate = formData.get('dueDate') as string | null
  const notes = formData.get('notes') as string | null
  const file = formData.get('file') as File | null

  if (!userId || !total || !file) {
    return { success: false, error: 'Client, total amount, and file are required.' }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await uploadClientDocToR2(buffer, {
      userId,
      category: 'invoices',
      filename: file.name,
      contentType: file.type || 'application/pdf',
    })

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber: generateNumber('INV'),
        userId,
        projectId,
        pdfUrl: upload.url,
        total,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'sent',
        notes: notes || null,
      })
      .returning()

    if (projectId) {
      const admin = await getOrCreateCurrentUser()
      await db.insert(projectActivity).values({
        projectId,
        actorUserId: admin?.id || null,
        actorType: 'admin',
        action: 'invoice_sent',
        summary: `Invoice ${invoice.invoiceNumber} was sent`,
      })
      revalidatePath(`/admin/client-projects/${projectId}`)
    }

    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    return { success: true, invoice }
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return { success: false, error: 'Failed to upload invoice.' }
  }
}

export async function uploadReceipt(formData: FormData) {
  if (!isR2Configured()) {
    return { success: false, error: 'Cloudflare R2 is not configured.' }
  }

  const invoiceId = formData.get('invoiceId') as string
  const amountPaid = formData.get('amountPaid') as string
  const file = formData.get('file') as File | null

  if (!invoiceId || !file) {
    return { success: false, error: 'Invoice and receipt file are required.' }
  }

  try {
    const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) })
    if (!invoice) return { success: false, error: 'Invoice not found.' }

    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await uploadClientDocToR2(buffer, {
      userId: invoice.userId,
      category: 'receipts',
      filename: file.name,
      contentType: file.type || 'application/pdf',
    })

    const newAmountPaid = amountPaid ? Number(amountPaid) : Number(invoice.total)
    const status = newAmountPaid >= Number(invoice.total) ? 'paid' : 'partial'

    await db
      .update(invoices)
      .set({
        receiptUrl: upload.url,
        receiptUploadedAt: new Date(),
        amountPaid: String(newAmountPaid),
        status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))

    if (invoice.projectId) {
      await db.insert(projectActivity).values({
        projectId: invoice.projectId,
        actorType: 'admin',
        action: 'payment_recorded',
        summary: `Receipt uploaded for invoice ${invoice.invoiceNumber}`,
      })
    }

    revalidatePath('/admin/billing')
    revalidatePath('/client/billing')
    return { success: true }
  } catch (error) {
    console.error('Failed to upload receipt:', error)
    return { success: false, error: 'Failed to upload receipt.' }
  }
}