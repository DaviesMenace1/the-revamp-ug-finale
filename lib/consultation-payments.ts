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
import { flutterwaveErrorMessage, flutterwaveConfigurationMessage, getFlutterwaveConfig, retrieveFlutterwaveCharge } from '@/lib/flutterwave-config'
import { revalidatePath } from 'next/cache'

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

const BUDGET_LABELS: Record<string, string> = {
  under_10m: 'Under UGX 10 million',
  '10m_30m': 'UGX 10–30 million',
  '30m_75m': 'UGX 30–75 million',
  '75m_plus': 'UGX 75 million and above',
  not_sure: 'Not sure yet',
}

function parseBudget(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return { amount: null as string | null, label: null as string | null }

  const parsed = Number(normalized.replace(/,/g, ''))
  if (Number.isFinite(parsed) && parsed >= 0) return { amount: String(parsed), label: null as string | null }

  return { amount: null as string | null, label: BUDGET_LABELS[normalized] || normalized.slice(0, 100) }
}

function sameMoney(actual: unknown, expected: string) {
  return number(actual) + 0.001 >= number(expected)
}

async function verifyFlutterwaveTransaction(chargeId: string, expectedTxRef: string, expectedAmount: string, expectedCurrency: string) {
  const config = getFlutterwaveConfig()
  if (!config.ok) return { verified: false as const, error: flutterwaveConfigurationMessage(config) }
  if (!chargeId || !/^chg_[A-Za-z0-9]+$/.test(chargeId)) return { verified: false as const, error: 'Flutterwave did not provide a valid charge id.' }

  try {
    const result = await retrieveFlutterwaveCharge(chargeId)
    const payload = result.payload || {}
    const data = payload.data
    if (!result.response?.ok || payload.status !== 'success' || !data || data.status !== 'succeeded') {
      const pending = Boolean(result.response?.ok && payload.status === 'success' && data && ['pending', 'requires_authorization'].includes(String(data.status)))
      return { verified: false as const, pending, error: flutterwaveErrorMessage(payload, result.response?.status || 502) }
    }
    if (String(data.reference || data.tx_ref || '') !== expectedTxRef) return { verified: false as const, error: 'The payment reference does not match this consultation.' }
    if (String(data.currency || '').toUpperCase() !== expectedCurrency.toUpperCase()) return { verified: false as const, error: 'The payment currency does not match this consultation.' }
    if (!sameMoney(data.amount, expectedAmount)) return { verified: false as const, error: 'The verified payment amount is less than the consultation total.' }
    return { verified: true as const, transactionId: String(data.id || chargeId), paymentMethod: data.payment_method_details?.type || data.payment_method?.type || null }
  } catch (error) {
    return { verified: false as const, error: error instanceof Error ? error.message : 'Flutterwave verification failed.' }
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
    await db.update(consultationPaymentIntents).set({ status: verification.pending ? 'pending' : input.transactionId ? 'verification_failed' : 'pending', failedAt: verification.pending ? null : input.transactionId ? new Date() : null, updatedAt: new Date() }).where(and(eq(consultationPaymentIntents.id, intent.id), eq(consultationPaymentIntents.status, 'pending')))
    return { success: false as const, status: verification.pending ? 'pending' as const : 'verification_failed' as const, error: verification.error }
  }

  const now = new Date()
  const metadata = (intent.metadata || {}) as IntentMetadata
  const budget = parseBudget(metadata.budget)
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
      description: [
        text(metadata.description, '', 5000),
        budget.label ? `Budget range: ${budget.label}` : null,
      ].filter(Boolean).join('\n\n').slice(0, 5000) || null,
      serviceType: text(metadata.serviceType, '', 100) || null,
      budget: budget.amount,
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
