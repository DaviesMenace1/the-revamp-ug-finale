import 'server-only'

import { db } from '@/lib/db/client'
import { financialDocuments } from '@/lib/db/schema'
import { getCompanyProfile } from '@/lib/documents/company-profile'
import { renderFinancialDocument } from '@/lib/documents/pdf'
import { isR2Configured, uploadClientDocToR2 } from '@/lib/storage/r2'

type ReceiptItem = {
  name?: string
  title?: string
  quantity?: number | string
  unitPrice?: number | string
  price?: number | string
  color?: unknown
  fabric?: unknown
  material?: unknown
  variant?: unknown
  accessories?: unknown
  dimensions?: unknown
}

function optionLabel(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const item = value as Record<string, unknown>
  const label = typeof item.label === 'string' ? item.label : typeof item.name === 'string' ? item.name : typeof item.value === 'string' ? item.value : ''
  return label.trim()
}

function itemDescription(value: ReceiptItem) {
  const base = value.name || value.title || 'Product'
  const options = [
    ['Colour', optionLabel(value.color)],
    ['Fabric', optionLabel(value.fabric)],
    ['Material', optionLabel(value.material)],
    ['Variant', optionLabel(value.variant)],
    ['Accessories', Array.isArray(value.accessories) ? value.accessories.map(optionLabel).filter(Boolean).join(', ') : ''],
    ['Measurements', value.dimensions && typeof value.dimensions === 'object' ? Object.entries(value.dimensions as Record<string, unknown>).filter(([key, entry]) => key !== 'unit' && entry).map(([key, entry]) => `${key}: ${String(entry)}`).join(', ') : ''],
  ].filter(([, entry]) => entry)
  return [base, ...options.map(([key, entry]) => `${key}: ${entry}`)].join(' | ')
}

function deliverySummary(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Delivery details recorded at checkout.'
  const address = value as Record<string, unknown>
  if (address.deliveryMethod === 'pickup_station' && address.pickupStation && typeof address.pickupStation === 'object') {
    const station = address.pickupStation as Record<string, unknown>
    return `Pickup station: ${String(station.name || 'Selected station')}, ${String(station.address || '')}`.trim()
  }
  return `Door delivery: ${String(address.address || '')}, ${String(address.city || '')}`.trim()
}

export async function generateVerifiedPaymentReceipt(input: {
  paymentId: string
  userId: string
  clientName: string
  clientEmail: string
  orderNumber: string
  amount: string
  currency: string
  paymentMethod: string | null
  paymentMode?: string | null
  transactionReference: string
  items?: unknown
  shipping?: string | number | null
  discount?: string | number | null
  deliveryAddress?: unknown
  refundStatus?: string | null
}) {
  if (!isR2Configured()) {
    console.warn('[billing] R2 is not configured; verified payment was recorded without a generated receipt file.')
    return null
  }

  try {
    const profile = await getCompanyProfile()
    const documentNumber = `RV-RCPT-${new Date().getUTCFullYear()}-${Date.now().toString(36).toUpperCase()}`
    const rawItems = Array.isArray(input.items) ? input.items as ReceiptItem[] : []
    const lineItems = rawItems.slice(0, 18).map((item) => ({ description: itemDescription(item), quantity: Math.max(1, Number(item.quantity) || 1), unitPrice: Math.max(0, Number(item.unitPrice ?? item.price) || 0) }))
    const shipping = Math.max(0, Number(input.shipping) || 0)
    if (shipping > 0) lineItems.push({ description: 'Delivery', quantity: 1, unitPrice: shipping })
    const modeLabel = input.paymentMode === 'pay_on_delivery' ? 'Pay on delivery' : `Pay now via ${input.paymentMethod === 'mobile_money' ? 'mobile money' : input.paymentMethod === 'card' ? 'card' : 'Flutterwave'}`
    const notes = [`Transaction reference: ${input.transactionReference}`, `Payment mode: ${modeLabel}`, deliverySummary(input.deliveryAddress), input.refundStatus && input.refundStatus !== 'not_requested' ? `Refund status: ${input.refundStatus}` : ''].filter(Boolean).join(' | ')
    const pdf = await renderFinancialDocument({
      documentType: 'payment_receipt',
      documentNumber,
      issueDate: new Date(),
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      projectName: `Order ${input.orderNumber}`,
      currency: input.currency,
      items: lineItems.length > 0 ? lineItems : [{ description: `Order ${input.orderNumber}`, quantity: 1, unitPrice: Number(input.amount) || 0 }],
      taxRate: 0,
      discount: Math.max(0, Number(input.discount) || 0),
      notes,
      paymentMethod: modeLabel,
      terms: 'This receipt confirms the payment status recorded for the order. Cancellation and refund requests are handled under the published policy.',
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
        paymentMode: input.paymentMode || 'pay_now',
        deliveryAddress: input.deliveryAddress || null,
        items: rawItems,
        refundStatus: input.refundStatus || 'not_requested',
        verifiedBy: 'flutterwave-webhook',
      },
    }).returning({ id: financialDocuments.id, documentNumber: financialDocuments.documentNumber, fileUrl: financialDocuments.fileUrl })
    return document
  } catch (error) {
    console.error('[billing] failed to generate verified payment receipt:', error)
    return null
  }
}
