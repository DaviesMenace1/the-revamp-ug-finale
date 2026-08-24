import 'server-only'

import { db } from '@/lib/db/client'
import { financialDocuments } from '@/lib/db/schema'
import { getCompanyProfile } from '@/lib/documents/company-profile'
import { renderFinancialDocument } from '@/lib/documents/pdf'
import { isR2Configured, uploadClientDocToR2 } from '@/lib/storage/r2'

export async function generateVerifiedPaymentReceipt(input: {
  paymentId: string
  userId: string
  clientName: string
  clientEmail: string
  orderNumber: string
  amount: string
  currency: string
  paymentMethod: string | null
  transactionReference: string
}) {
  if (!isR2Configured()) {
    console.warn('[billing] R2 is not configured; verified payment was recorded without a generated receipt file.')
    return null
  }

  try {
    const profile = await getCompanyProfile()
    const documentNumber = `RV-RCPT-${new Date().getUTCFullYear()}-${Date.now().toString(36).toUpperCase()}`
    const pdf = await renderFinancialDocument({
      documentType: 'payment_receipt',
      documentNumber,
      issueDate: new Date(),
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      projectName: `Order ${input.orderNumber}`,
      currency: input.currency,
      items: [{ description: `Verified payment for order ${input.orderNumber}`, quantity: 1, unitPrice: Number(input.amount) || 0 }],
      taxRate: 0,
      discount: 0,
      notes: `Gateway transaction reference: ${input.transactionReference}`,
      paymentMethod: input.paymentMethod || 'Flutterwave',
      terms: 'This receipt confirms a successful payment verified by the payment gateway webhook.',
    }, profile)
    const upload = await uploadClientDocToR2(pdf, {
      userId: input.userId,
      category: 'payment-receipts',
      filename: `${documentNumber}.pdf`,
      contentType: 'application/pdf',
    })
    const [document] = await db.insert(financialDocuments).values({
      documentNumber,
      documentType: 'payment_receipt',
      userId: input.userId,
      paymentId: input.paymentId,
      status: 'issued',
      amount: input.amount,
      currency: input.currency,
      storageProvider: 'r2',
      storageKey: upload.key,
      fileUrl: upload.url,
      fileName: `${documentNumber}.pdf`,
      mimeType: 'application/pdf',
      fileSize: upload.size,
      payload: {
        orderNumber: input.orderNumber,
        transactionReference: input.transactionReference,
        paymentMethod: input.paymentMethod,
        verifiedBy: 'flutterwave-webhook',
      },
    }).returning({ id: financialDocuments.id, documentNumber: financialDocuments.documentNumber, fileUrl: financialDocuments.fileUrl })
    return document
  } catch (error) {
    console.error('[billing] failed to generate verified payment receipt:', error)
    return null
  }
}
