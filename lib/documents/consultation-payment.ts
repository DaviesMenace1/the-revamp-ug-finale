import 'server-only'

import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { financialDocuments, invoices } from '@/lib/db/schema'
import { getCompanyProfile } from '@/lib/documents/company-profile'
import { renderFinancialDocument } from '@/lib/documents/pdf'
import { uploadClientDocToR2, isR2Configured } from '@/lib/storage/r2'
import { escapeEmailHtml, sendBrevoNotificationEmail } from '@/lib/email/send-notification'

export type ConsultationPaymentDocumentInput = {
  paymentRecordId: string
  consultationId: string
  userId: string
  clientName: string
  clientEmail: string
  title: string
  serviceType: string | null
  preferredDate: Date
  mode: string
  durationMinutes: number
  txRef: string
  paymentMethod: string | null
  baseAmount: number
  discountAmount: number
  taxAmount: number
  amount: number
  taxRate: number
  currency: string
  promotionCode: string | null
  taxInclusive: boolean
}

function documentNumbers(txRef: string) {
  const safeRef = txRef.replace(/[^A-Za-z0-9-]/g, '').slice(-38)
  return {
    invoice: `RV-INV-CONS-${safeRef}`.slice(0, 50),
    receipt: `RV-RCPT-CONS-${safeRef}`.slice(0, 50),
  }
}

function formatDate(date: Date) {
  return date.toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kampala' })
}

async function existingDocuments(input: ConsultationPaymentDocumentInput) {
  return db
    .select({ id: financialDocuments.id, documentNumber: financialDocuments.documentNumber, documentType: financialDocuments.documentType, fileUrl: financialDocuments.fileUrl })
    .from(financialDocuments)
    .where(and(eq(financialDocuments.paymentId, input.paymentRecordId), inArray(financialDocuments.documentType, ['consultation_invoice', 'consultation_receipt'])))
}

export async function generateConsultationPaymentDocuments(input: ConsultationPaymentDocumentInput) {
  const existing = await existingDocuments(input)
  if (existing.length >= 2) return { invoice: existing.find((item) => item.documentType === 'consultation_invoice') || null, receipt: existing.find((item) => item.documentType === 'consultation_receipt') || null, email: null }
  if (!isR2Configured()) {
    console.warn('[consultation-payment] R2 is not configured; payment settled without PDF documents.')
    return { invoice: null, receipt: null, email: null }
  }

  const numbers = documentNumbers(input.txRef)
  const profile = await getCompanyProfile()
  const items = [{ description: `Consultation booking: ${input.title}`, quantity: 1, unitPrice: input.baseAmount }]
  const shared = {
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    projectName: `${input.serviceType || 'Design consultation'} · ${formatDate(input.preferredDate)}`,
    currency: input.currency,
    items,
    taxRate: input.taxRate,
    taxInclusive: input.taxInclusive,
    discount: input.discountAmount,
    paymentMethod: input.paymentMethod || 'Flutterwave',
    notes: [
      `Consultation reference: ${input.consultationId}`,
      `Gateway transaction reference: ${input.txRef}`,
      input.promotionCode ? `Promotion applied: ${input.promotionCode}` : null,
    ].filter(Boolean).join('\n'),
    terms: 'This consultation booking is confirmed after successful payment verification. Please contact the studio if you need to change your appointment.',
  } as const

  const invoicePdf = await renderFinancialDocument({
    ...shared,
    documentType: 'consultation_invoice',
    documentNumber: numbers.invoice,
    issueDate: new Date(),
    dueDate: new Date(),
  }, profile)
  const receiptPdf = await renderFinancialDocument({
    ...shared,
    documentType: 'consultation_receipt',
    documentNumber: numbers.receipt,
    issueDate: new Date(),
    notes: `${shared.notes}\nPaid in full.`,
  }, profile)
  const [invoiceUpload, receiptUpload] = await Promise.all([
    uploadClientDocToR2(invoicePdf, { userId: input.userId, category: 'consultation-payments/invoices', filename: `${numbers.invoice}.pdf`, contentType: 'application/pdf' }),
    uploadClientDocToR2(receiptPdf, { userId: input.userId, category: 'consultation-payments/receipts', filename: `${numbers.receipt}.pdf`, contentType: 'application/pdf' }),
  ])

  let invoiceId: string | null = null
  try {
    const [invoice] = await db.insert(invoices).values({
      invoiceNumber: numbers.invoice,
      userId: input.userId,
      consultationId: input.consultationId,
      items,
      subtotal: input.baseAmount.toFixed(2),
      tax: input.taxAmount.toFixed(2),
      total: input.amount.toFixed(2),
      amountPaid: input.amount.toFixed(2),
      dueDate: new Date(),
      status: 'paid',
      pdfUrl: invoiceUpload.url,
      receiptUrl: receiptUpload.url,
      receiptUploadedAt: new Date(),
      notes: `Flutterwave transaction reference: ${input.txRef}`,
    }).returning({ id: invoices.id })
    invoiceId = invoice?.id || null
  } catch (error) {
    const [invoice] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.invoiceNumber, numbers.invoice)).limit(1)
    invoiceId = invoice?.id || null
    if (!invoiceId) throw error
  }

  const documentValues = [
    {
      documentNumber: numbers.invoice,
      documentType: 'consultation_invoice',
      userId: input.userId,
      consultationId: input.consultationId,
      invoiceId,
      paymentId: input.paymentRecordId,
      status: 'issued',
      amount: input.amount.toFixed(2),
      currency: input.currency,
      storageProvider: 'r2',
      storageKey: invoiceUpload.key,
      fileUrl: invoiceUpload.url,
      fileName: `${numbers.invoice}.pdf`,
      mimeType: 'application/pdf',
      fileSize: invoiceUpload.size,
      payload: { baseAmount: input.baseAmount, discountAmount: input.discountAmount, taxAmount: input.taxAmount, taxRate: input.taxRate, taxInclusive: input.taxInclusive, promotionCode: input.promotionCode, txRef: input.txRef },
    },
    {
      documentNumber: numbers.receipt,
      documentType: 'consultation_receipt',
      userId: input.userId,
      consultationId: input.consultationId,
      invoiceId,
      paymentId: input.paymentRecordId,
      status: 'issued',
      amount: input.amount.toFixed(2),
      currency: input.currency,
      storageProvider: 'r2',
      storageKey: receiptUpload.key,
      fileUrl: receiptUpload.url,
      fileName: `${numbers.receipt}.pdf`,
      mimeType: 'application/pdf',
      fileSize: receiptUpload.size,
      payload: { baseAmount: input.baseAmount, discountAmount: input.discountAmount, taxAmount: input.taxAmount, taxRate: input.taxRate, taxInclusive: input.taxInclusive, promotionCode: input.promotionCode, txRef: input.txRef, paidInFull: true },
    },
  ]

  for (const document of documentValues) {
    await db.insert(financialDocuments).values(document).onConflictDoNothing({ target: financialDocuments.documentNumber })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || ''
  const email = input.clientEmail
    ? await sendBrevoNotificationEmail({
        toEmail: input.clientEmail,
        toName: input.clientName,
        subject: `Consultation payment confirmed · ${numbers.receipt}`,
        htmlContent: `<!doctype html><html><body style="margin:0;background:#f6f4ef;color:#1e1c19;font-family:Arial,sans-serif;padding:32px 16px"><main style="max-width:600px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e5e0d8"><p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b6b3f">The Revamp UG</p><h1 style="font-size:26px;font-weight:400;margin:18px 0 10px">Your consultation is confirmed</h1><p style="font-size:15px;line-height:1.7">Hi ${escapeEmailHtml(input.clientName || 'there')}, your payment of ${escapeEmailHtml(input.amount.toLocaleString('en-UG'))} ${escapeEmailHtml(input.currency)} has been verified for <strong>${escapeEmailHtml(input.title)}</strong>.</p><p style="font-size:15px;line-height:1.7">Your invoice (${escapeEmailHtml(numbers.invoice)}) and paid receipt (${escapeEmailHtml(numbers.receipt)}) are available in your client portal.</p><p style="margin-top:28px"><a href="${escapeEmailHtml(`${siteUrl}/client/billing`)}" style="display:inline-block;background:#1e1c19;color:#fff;text-decoration:none;padding:13px 18px;font-size:12px;letter-spacing:1px;text-transform:uppercase">Open billing documents</a></p><p style="margin-top:34px;color:#6f6a62;font-size:12px;line-height:1.6">Appointment: ${escapeEmailHtml(formatDate(input.preferredDate))} · ${escapeEmailHtml(input.mode.replaceAll('_', ' '))}</p></main></body></html>`,
      })
    : null

  return {
    invoice: { documentNumber: numbers.invoice, fileUrl: invoiceUpload.url },
    receipt: { documentNumber: numbers.receipt, fileUrl: receiptUpload.url },
    email,
  }
}
