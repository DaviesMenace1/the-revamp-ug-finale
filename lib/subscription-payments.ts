import 'server-only'

import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { memberships, paymentRecords, programSubscriptions, tradeMembers, users } from '@/lib/db/schema'
import { flutterwaveErrorMessage, retrieveFlutterwaveCharge } from '@/lib/flutterwave-config'
import { subscriptionEndDate, type SubscriptionBillingPeriod, type SubscriptionProgram } from '@/lib/subscriptions'

function sameMoney(actual: unknown, expected: unknown) {
  return Number(actual) + 0.001 >= Number(expected)
}

function parseMetadata(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export async function settleSubscriptionPayment(input: { transactionReference: string; chargeId?: string | null }) {
  const subscription = await db.query.programSubscriptions.findFirst({ where: eq(programSubscriptions.transactionReference, input.transactionReference) })
  if (!subscription) return { success: false as const, status: 'not_found' as const, error: 'Subscription payment was not found.' }
  if (subscription.status === 'active') return { success: true as const, status: 'active' as const, subscriptionId: subscription.id }

  const chargeId = String(input.chargeId || subscription.providerChargeId || '').trim()
  if (!chargeId) return { success: false as const, status: 'pending' as const, error: 'The subscription payment is still awaiting authorization.' }

  const result = await retrieveFlutterwaveCharge(chargeId)
  const payload = result.payload || {}
  const charge = payload.data
  const expectedCurrency = String(subscription.currency || process.env.FLUTTERWAVE_CURRENCY || 'UGX').toUpperCase()
  const successful = Boolean(result.response?.ok && String(payload.status || '').toLowerCase() === 'success' && String(charge?.status || '').toLowerCase() === 'succeeded')
  if (!successful || !charge) {
    if (result.response?.status === 401 || result.response?.status === 403) return { success: false as const, status: 'verification_failed' as const, error: flutterwaveErrorMessage(payload, result.response.status) }
    return { success: false as const, status: 'pending' as const, error: payload.error?.message || payload.message || 'The subscription payment is still awaiting authorization.' }
  }
  if (String(charge.reference || charge.tx_ref || '') !== subscription.transactionReference) return { success: false as const, status: 'verification_failed' as const, error: 'The payment reference does not match this subscription.' }
  if (String(charge.currency || '').toUpperCase() !== expectedCurrency) return { success: false as const, status: 'verification_failed' as const, error: 'The payment currency does not match this subscription.' }
  if (!sameMoney(charge.amount, subscription.amount)) return { success: false as const, status: 'verification_failed' as const, error: 'The verified payment amount is less than the subscription price.' }

  const now = new Date()
  const endDate = subscriptionEndDate(now, subscription.billingPeriod as SubscriptionBillingPeriod)
  const [activated] = await db.update(programSubscriptions).set({ status: 'active', startDate: now, endDate, providerChargeId: chargeId, updatedAt: now }).where(and(eq(programSubscriptions.id, subscription.id), ne(programSubscriptions.status, 'active'))).returning({ id: programSubscriptions.id })
  if (!activated) return { success: true as const, status: 'active' as const, subscriptionId: subscription.id }

  const method = charge.payment_method_details?.type || charge.payment_method?.type || null
  const metadata = parseMetadata(subscription.metadata)
  await db.update(paymentRecords).set({ transactionReference: chargeId, method, status: 'completed', metadata: { ...metadata, txRef: subscription.transactionReference, chargeId, paymentType: 'subscription', program: subscription.program, planKey: subscription.planKey }, paidAt: now, updatedAt: now }).where(and(eq(paymentRecords.subscriptionId, subscription.id), eq(paymentRecords.status, 'pending')))

  const customer = await db.query.users.findFirst({ where: eq(users.id, subscription.userId) })
  if (subscription.program === 'membership') {
    const existingMembership = await db.query.memberships.findFirst({ where: eq(memberships.userId, subscription.userId) })
    const benefits = Array.isArray(metadata.benefits) ? metadata.benefits : []
    if (existingMembership) {
      await db.update(memberships).set({ membershipType: subscription.planKey, status: 'active', startDate: now, endDate, benefits, updatedAt: now }).where(eq(memberships.id, existingMembership.id))
    } else {
      await db.insert(memberships).values({ userId: subscription.userId, membershipType: subscription.planKey, status: 'active', startDate: now, endDate, benefits })
    }
  } else {
    const discountRate = Number(metadata.discountRate)
    const existingTrade = await db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, subscription.userId) })
    if (existingTrade) {
      await db.update(tradeMembers).set({ status: 'active', tier: subscription.planKey, discountRate: Number.isFinite(discountRate) ? discountRate.toFixed(2) : existingTrade.discountRate, approvedAt: now, updatedAt: now }).where(eq(tradeMembers.id, existingTrade.id))
    } else if (customer) {
      await db.insert(tradeMembers).values({ userId: subscription.userId, businessName: customer.email, status: 'active', tier: subscription.planKey, discountRate: Number.isFinite(discountRate) ? discountRate.toFixed(2) : '10.00', approvedAt: now })
    }
  }

  return { success: true as const, status: 'active' as const, subscriptionId: subscription.id }
}

export async function failSubscriptionPayment(transactionReference: string) {
  const now = new Date()
  const [subscription] = await db.update(programSubscriptions).set({ status: 'failed', updatedAt: now }).where(and(eq(programSubscriptions.transactionReference, transactionReference), eq(programSubscriptions.status, 'pending'))).returning({ id: programSubscriptions.id })
  if (subscription) await db.update(paymentRecords).set({ status: 'failed', updatedAt: now }).where(and(eq(paymentRecords.subscriptionId, subscription.id), eq(paymentRecords.status, 'pending')))
}

export function subscriptionProgram(value: unknown): SubscriptionProgram | null {
  return value === 'membership' || value === 'trade' ? value : null
}
