import 'server-only'

import { and, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  consultationPaymentIntents,
  consultationPromotionRedemptions,
  consultationSlots,
  consultations,
  paymentRecords,
  users,
} from '@/lib/db/schema'
import { generateConsultationPaymentDocuments } from '@/lib/documents/consultation-payment'
import { notifyUser } from '@/lib/notifications/service'
import { flutterwaveConfigurationMessage, getFlutterwaveConfig } from '@/lib/flutterwave-config'
import { revalidatePath } from 'next/cache'

type FlutterwaveVerification = {
  status?: string
  message?: string
  data?: {
    id?: string | number
    status?: string
    tx_ref?: string
    amount?: string | number
    currency?: string
    payment_type?: string
    payment_method?: string
  }
}

type IntentMetadata = {
  title?: unknown
  description?: unknown
  serviceType?: unknown
  budget?: unknown
  mode?: unknown
}

function text(value: unknown, fallback: string, maxLength: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : fallback
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function sameMoney(actual: unknown, expected: string) {
  return number(actual) + 0.001 >= number(expected)
}

async function verifyFlutterwaveTransaction(transactionId: string, expectedTxRef: string, expectedAmount: string, expectedCurrency: string) {
  const config = getFlutterwaveConfig()
  if (!config.ok) return { verified: false as const, error: flutterwaveConfigurationMessage(config) }
  if (!transactionId || !/^\d+$/.test(transactionId)) return { verified: false as const, error: 'Flutterwave did not provide a valid transaction id.' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(`${config.baseUrl}/transactions/${encodeURIComponent(transactionId)}/verify`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.secretKey}`, Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => ({})) as FlutterwaveVerification
    const data = payload.data
    if (!response.ok || payload.status !== 'success' || !data || data.status !== 'successful') {
      if (response.status === 401) return { verified: false as const, error: `Flutterwave rejected the ${config.mode} server key. Confirm FLUTTERWAVE_SECRET_KEY contains the matching secret key, not the public key.` }
      return { verified: false as const, error: payload.message || 'Flutterwave has not marked this payment successful.' }
    }
    if (data.tx_ref !== expectedTxRef) return { verified: false as const, error: 'The payment reference does not match this consultation.' }
    if (String(data.currency || '').toUpperCase() !== expectedCurrency.toUpperCase()) return { verified: false as const, error: 'The payment currency does not match this consultation.' }
    if (!sameMoney(data.amount, expectedAmount)) return { verified: false as const, error: 'The verified payment amount is less than the consultation total.' }
    return {
      verified: true as const,
      transactionId: String(data.id || transactionId),
      paymentMethod: data.payment_type || data.payment_method || null,
    }
  } catch (error) {
    return { verified: false as const, error: error instanceof Error ? error.message : 'Flutterwave verification failed.' }
  } finally {
    clearTimeout(timeout)
  }
}

export async function settleConsultationPayment(input: {
  txRef: string
  transactionId?: string | null
}) {
  const [intent] = await db.select().from(consultationPaymentIntents).where(eq(consultationPaymentIntents.txRef, input.txRef)).limit(1)
  if (!intent) return { success: false as const, status: 'not_found' as const, error: 'Consultation payment was not found.' }
  if (intent.status === 'paid' && intent.consultationId) return { success: true as const, status: 'paid' as const, consultationId: intent.consultationId }

  const verification = await verifyFlutterwaveTransaction(String(input.transactionId || intent.flutterwaveTransactionId || ''), intent.txRef, intent.amount, intent.currency)
  if (!verification.verified) {
    await db.update(consultationPaymentIntents).set({ status: input.transactionId ? 'verification_failed' : 'pending', failedAt: input.transactionId ? new Date() : null, updatedAt: new Date() }).where(and(eq(consultationPaymentIntents.id, intent.id), eq(consultationPaymentIntents.status, 'pending')))
    return { success: false as const, status: 'verification_failed' as const, error: verification.error }
  }

  const now = new Date()
  const metadata = (intent.metadata || {}) as IntentMetadata
  const booking = await db.transaction(async (transaction) => {
    const [slot] = await transaction
      .update(consultationSlots)
      .set({ isBooked: true, holdUntil: null, holdUserId: null })
      .where(and(eq(consultationSlots.id, intent.slotId), eq(consultationSlots.isBooked, false), eq(consultationSlots.holdUserId, intent.userId), gte(consultationSlots.startTime, now)))
      .returning({ id: consultationSlots.id, startTime: consultationSlots.startTime, durationMinutes: consultationSlots.durationMinutes, mode: consultationSlots.mode })
    if (!slot) return { kind: 'review' as const }

    const [consultation] = await transaction.insert(consultations).values({
      userId: intent.userId,
      title: text(metadata.title, 'Design consultation', 255),
      description: text(metadata.description, '', 5000) || null,
      serviceType: text(metadata.serviceType, '', 100) || null,
      budget: text(metadata.budget, '', 100) || null,
      preferredDate: slot.startTime,
      mode: slot.mode,
      durationMinutes: slot.durationMinutes,
      status: 'scheduled',
      paymentStatus: 'paid',
      paymentAmount: intent.amount,
      paymentCurrency: intent.currency,
      paymentReference: intent.txRef,
      baseFee: intent.baseAmount,
      discountAmount: intent.discountAmount,
      taxAmount: intent.taxAmount,
      promotionCode: intent.promotionCode,
      confirmedAt: now,
    }).returning()
    if (!consultation) return { kind: 'review' as const }

    await transaction.update(consultationSlots).set({ consultationId: consultation.id }).where(eq(consultationSlots.id, slot.id))
    const [payment] = await transaction.insert(paymentRecords).values({
      userId: intent.userId,
      consultationId: consultation.id,
      provider: 'flutterwave',
      transactionReference: intent.txRef,
      amount: intent.amount,
      currency: intent.currency,
      method: verification.paymentMethod,
      status: 'completed',
      metadata: { paymentIntentId: intent.id, flutterwaveTransactionId: verification.transactionId, promotionCode: intent.promotionCode },
      paidAt: now,
    }).onConflictDoNothing({ target: [paymentRecords.provider, paymentRecords.transactionReference] }).returning({ id: paymentRecords.id })
    const paymentId = payment?.id || (await transaction.select({ id: paymentRecords.id }).from(paymentRecords).where(and(eq(paymentRecords.provider, 'flutterwave'), eq(paymentRecords.transactionReference, intent.txRef))).limit(1))[0]?.id
    if (!paymentId) return { kind: 'review' as const }

    await transaction.update(consultationPaymentIntents).set({ status: 'paid', consultationId: consultation.id, flutterwaveTransactionId: verification.transactionId, paymentMethod: verification.paymentMethod, paidAt: now, updatedAt: now }).where(and(eq(consultationPaymentIntents.id, intent.id), eq(consultationPaymentIntents.status, 'pending')))
    if (intent.promotionId) {
      await transaction.update(consultationPromotionRedemptions).set({ status: 'applied', appliedAt: now, updatedAt: now }).where(and(eq(consultationPromotionRedemptions.paymentIntentId, intent.id), eq(consultationPromotionRedemptions.status, 'reserved')))
    }
    return { kind: 'paid' as const, consultation, paymentId, slot }
  })

  if (booking.kind === 'review') {
    await db.update(consultationPaymentIntents).set({ status: 'paid_review', flutterwaveTransactionId: verification.transactionId, paymentMethod: verification.paymentMethod, updatedAt: now }).where(eq(consultationPaymentIntents.id, intent.id))
    return { success: false as const, status: 'paid_review' as const, error: 'Payment was verified, but the selected time is no longer held. Please contact the studio so the payment can be matched safely.' }
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, intent.userId), columns: { email: true, firstName: true, lastName: true } })
  const clientName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Client'
  let documentResult: Awaited<ReturnType<typeof generateConsultationPaymentDocuments>> = { invoice: null, receipt: null, email: null }
  try {
    documentResult = await generateConsultationPaymentDocuments({
    paymentRecordId: booking.paymentId,
    consultationId: booking.consultation.id,
    userId: intent.userId,
    clientName,
    clientEmail: user?.email || '',
    title: text(metadata.title, 'Design consultation', 255),
    serviceType: text(metadata.serviceType, '', 100) || null,
    preferredDate: booking.slot.startTime,
    mode: booking.slot.mode,
    durationMinutes: booking.slot.durationMinutes,
    txRef: intent.txRef,
    paymentMethod: verification.paymentMethod,
    baseAmount: number(intent.baseAmount),
    discountAmount: number(intent.discountAmount),
    taxAmount: number(intent.taxAmount),
    amount: number(intent.amount),
    taxRate: number(intent.taxRate),
    currency: intent.currency,
    promotionCode: intent.promotionCode,
    taxInclusive: Boolean((metadata as Record<string, unknown>).taxInclusive),
    })
  } catch (error) {
    console.error('[consultation-payment] document generation failed after settlement:', error)
  }

  await notifyUser({
    userId: intent.userId,
    type: 'consultation_payment_confirmed',
    priority: 'important',
    title: 'Consultation payment confirmed',
    message: `Your consultation payment of ${Number(intent.amount).toLocaleString('en-UG')} ${intent.currency} was verified. Your appointment and documents are ready in the client portal.`,
    actionUrl: '/client/consultations',
    metadata: { consultationId: booking.consultation.id, paymentIntentId: intent.id, paymentRecordId: booking.paymentId, txRef: intent.txRef },
    channels: documentResult.email ? ['in_app', 'push'] : ['in_app', 'push', 'email'],
  })
  revalidatePath('/client/consultations')
  revalidatePath('/client/billing')
  revalidatePath('/admin/consultations')
  revalidatePath('/admin/billing')
  return { success: true as const, status: 'paid' as const, consultationId: booking.consultation.id, paymentRecordId: booking.paymentId, documents: documentResult }
}
