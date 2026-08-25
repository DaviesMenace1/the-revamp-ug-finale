'use server'

import { and, desc, eq, gt, gte, lt, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  loyaltyAccounts,
  loyaltyReferrals,
  loyaltyTransactions,
  orders,
  users,
} from '@/lib/db/schema'
import { getSetting } from '@/lib/actions/settings'
import { getLoyaltyTier, DEFAULT_LOYALTY_RULES, LOYALTY_SETTING_KEY, normalizeLoyaltyRules, type LoyaltyRules } from './config'

export type LoyaltyEventType =
  | 'welcome'
  | 'daily_login'
  | 'referral_signup'
  | 'referral_qualified'
  | 'order_purchase'
  | 'review'
  | 'consultation_completed'
  | 'profile_completion'
  | 'redemption_hold'
  | 'redemption_release'
  | 'expiration'
  | 'admin_adjustment'

export async function getLoyaltyRules() {
  const stored = await getSetting<Partial<LoyaltyRules>>(LOYALTY_SETTING_KEY, DEFAULT_LOYALTY_RULES)
  return normalizeLoyaltyRules(stored)
}

export async function getOrCreateLoyaltyAccount(userId: string) {
  const existing = await db.query.loyaltyAccounts.findFirst({ where: eq(loyaltyAccounts.userId, userId) })
  if (existing) return existing

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const [created] = await db
        .insert(loyaltyAccounts)
        .values({ userId, referralCode: createReferralCode() })
        .onConflictDoNothing({ target: loyaltyAccounts.userId })
        .returning()
      if (created) return created
    } catch (error) {
      if (attempt === 2) throw error
    }

    const afterRace = await db.query.loyaltyAccounts.findFirst({ where: eq(loyaltyAccounts.userId, userId) })
    if (afterRace) return afterRace
  }

  throw new Error('Loyalty account could not be prepared.')
}

export async function getLoyaltyOverview(userId: string) {
  const rules = await getLoyaltyRules()
  if (!rules.enabled) return null

  const account = await getOrCreateLoyaltyAccount(userId)
  await expirePointsForUser(account.id, userId, rules)
  await awardWelcomePoints(userId, rules)
  await claimDailyLoginPoints(userId, rules)

  const refreshed = await db.query.loyaltyAccounts.findFirst({ where: eq(loyaltyAccounts.id, account.id) })
  const current = refreshed ?? account
  const recentTransactions = await db
    .select({
      id: loyaltyTransactions.id,
      points: loyaltyTransactions.points,
      type: loyaltyTransactions.type,
      description: loyaltyTransactions.description,
      createdAt: loyaltyTransactions.createdAt,
      expiresAt: loyaltyTransactions.expiresAt,
    })
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.accountId, current.id))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(12)

  const referrals = await db
    .select({
      id: loyaltyReferrals.id,
      status: loyaltyReferrals.status,
      rewardPoints: loyaltyReferrals.rewardPoints,
      createdAt: loyaltyReferrals.createdAt,
      qualifiedAt: loyaltyReferrals.qualifiedAt,
    })
    .from(loyaltyReferrals)
    .where(eq(loyaltyReferrals.referrerUserId, userId))
    .orderBy(desc(loyaltyReferrals.createdAt))
    .limit(8)

  const tier = getLoyaltyTier(current.lifetimeEarned, rules)
  const nextTier = rules.tiers.find((item) => item.lifetimePoints > current.lifetimeEarned) ?? null
  const today = loyaltyDateKey()

  return {
    enabled: rules.enabled,
    balancePoints: current.balancePoints,
    lifetimeEarned: current.lifetimeEarned,
    lifetimeRedeemed: current.lifetimeRedeemed,
    referralCode: current.referralCode,
    referralLinkPath: `/signup?ref=${encodeURIComponent(current.referralCode)}`,
    tier: tier.label,
    tierKey: tier.key,
    nextTier: nextTier?.label ?? null,
    pointsToNextTier: nextTier ? Math.max(0, nextTier.lifetimePoints - current.lifetimeEarned) : 0,
    dailyClaimedToday: current.lastDailyClaimedAt?.toISOString().slice(0, 10) === today,
    recentTransactions,
    referrals,
    rules: {
      pointsPerUgxDescription: rules.pointsPerUgxDescription,
      dailyLoginPoints: rules.dailyLoginPoints,
      welcomePoints: rules.welcomePoints,
      reviewPoints: rules.reviewPoints,
      consultationPoints: rules.consultationPoints,
      referralRewardPoints: rules.referralRewardPoints,
      redemptionUgxPerPoint: rules.redemptionUgxPerPoint,
      redemptionCapPercent: rules.redemptionCapPercent,
    },
  }
}

export async function claimDailyLoginPoints(userId: string, rulesOverride?: LoyaltyRules) {
  const rules = rulesOverride ?? (await getLoyaltyRules())
  if (!rules.enabled || rules.dailyLoginPoints <= 0) return { awarded: false, points: 0 }

  const today = new Date().toISOString().slice(0, 10)
  const account = await getOrCreateLoyaltyAccount(userId)
  if (account.lastDailyClaimedAt?.toISOString().slice(0, 10) === today) return { awarded: false, points: 0 }

  return applyLedgerDelta({
    userId,
    points: rules.dailyLoginPoints,
    type: 'daily_login',
    eventKey: `daily_login:${userId}:${today}`,
    description: 'Daily account check-in',
    updateDailyClaimAt: true,
    rules,
  })
}

export async function awardWelcomePoints(userId: string, rulesOverride?: LoyaltyRules) {
  const rules = rulesOverride ?? (await getLoyaltyRules())
  if (!rules.enabled || rules.welcomePoints <= 0) return { awarded: false, points: 0 }
  return applyLedgerDelta({
    userId,
    points: rules.welcomePoints,
    type: 'welcome',
    eventKey: `welcome:${userId}`,
    description: 'Welcome to The Revamp rewards',
    rules,
  })
}

export async function attributeReferralCodeForUser(userId: string, referralCode: string) {
  const normalizedCode = referralCode.trim().toUpperCase().slice(0, 32)
  if (!normalizedCode) return { attributed: false }

  const rules = await getLoyaltyRules()
  if (!rules.enabled) return { attributed: false }

  const existing = await db.query.loyaltyReferrals.findFirst({ where: eq(loyaltyReferrals.referredUserId, userId) })
  if (existing) {
    await applyLedgerDelta({
      userId,
      points: rules.referralSignupPoints,
      type: 'referral_signup',
      eventKey: `referral_signup:${existing.id}`,
      description: 'Referral welcome reward',
      rules,
    })
    return { attributed: false, referralId: existing.id }
  }

  const referrerAccount = await db.query.loyaltyAccounts.findFirst({ where: eq(loyaltyAccounts.referralCode, normalizedCode) })
  if (!referrerAccount || referrerAccount.userId === userId) return { attributed: false }

  const [referral] = await db
    .insert(loyaltyReferrals)
    .values({
      referralCode: normalizedCode,
      referrerUserId: referrerAccount.userId,
      referredUserId: userId,
      rewardPoints: rules.referralRewardPoints,
    })
    .onConflictDoNothing({ target: loyaltyReferrals.referredUserId })
    .returning()

  if (!referral) return { attributed: false }

  await applyLedgerDelta({
    userId,
    points: rules.referralSignupPoints,
    type: 'referral_signup',
    eventKey: `referral_signup:${referral.id}`,
    description: 'Referral welcome reward',
    rules,
  })

  return { attributed: true, referralId: referral.id }
}

export async function qualifyReferralForOrder(userId: string, orderId: string, orderTotal: string | number) {
  const rules = await getLoyaltyRules()
  if (!rules.enabled || Number(orderTotal) < rules.referralMinimumOrderUgx) return { qualified: false }

  const referral = await db.query.loyaltyReferrals.findFirst({
    where: and(
      eq(loyaltyReferrals.referredUserId, userId),
      or(
        eq(loyaltyReferrals.status, 'pending'),
        and(eq(loyaltyReferrals.status, 'qualified'), eq(loyaltyReferrals.qualifyingOrderId, orderId)),
      ),
    ),
  })
  if (!referral) return { qualified: false }

  if (referral.status === 'pending') {
    const [qualified] = await db
      .update(loyaltyReferrals)
      .set({ status: 'qualified', qualifyingOrderId: orderId, qualifiedAt: new Date() })
      .where(and(eq(loyaltyReferrals.id, referral.id), eq(loyaltyReferrals.status, 'pending')))
      .returning({ id: loyaltyReferrals.id })
    if (!qualified) return { qualified: false }
  }

  await applyLedgerDelta({
    userId: referral.referrerUserId,
    points: referral.rewardPoints,
    type: 'referral_qualified',
    eventKey: `referral_reward:referrer:${referral.id}`,
    description: 'Referral order reward',
    rules,
  })
  await applyLedgerDelta({
    userId: referral.referredUserId,
    points: rules.referralSignupPoints,
    type: 'referral_qualified',
    eventKey: `referral_reward:referred:${referral.id}`,
    description: 'Referral order bonus',
    rules,
  })

  return { qualified: true, referralId: referral.id }
}

export async function awardOrderPoints(userId: string, orderId: string, qualifyingAmount: string | number) {
  const rules = await getLoyaltyRules()
  if (!rules.enabled || rules.pointsPerUgx <= 0) return { awarded: false, points: 0 }
  const points = Math.floor(Math.max(0, Number(qualifyingAmount) || 0) * rules.pointsPerUgx)
  if (points <= 0) return { awarded: false, points: 0 }

  return applyLedgerDelta({
    userId,
    points,
    type: 'order_purchase',
    eventKey: `order_purchase:${orderId}`,
    description: `Points from order ${orderId.slice(0, 8).toUpperCase()}`,
    orderId,
    rules,
  })
}

export async function awardReviewPoints(userId: string, reviewId: string, productId: string) {
  const rules = await getLoyaltyRules()
  if (!rules.enabled || rules.reviewPoints <= 0) return { awarded: false, points: 0 }
  return applyLedgerDelta({
    userId,
    points: rules.reviewPoints,
    type: 'review',
    eventKey: `review:${userId}:${productId}`,
    description: `Verified review ${reviewId.slice(0, 8).toUpperCase()}`,
    rules,
  })
}

export async function awardConsultationPoints(userId: string, consultationId: string) {
  const rules = await getLoyaltyRules()
  if (!rules.enabled || rules.consultationPoints <= 0) return { awarded: false, points: 0 }
  return applyLedgerDelta({
    userId,
    points: rules.consultationPoints,
    type: 'consultation_completed',
    eventKey: `consultation_completed:${consultationId}`,
    description: 'Completed studio consultation',
    rules,
  })
}

export async function settleSuccessfulOrderRewards(userId: string, orderId: string, qualifyingAmount: string | number) {
  try {
    await awardOrderPoints(userId, orderId, qualifyingAmount)
  } catch (error) {
    console.error('[loyalty] order reward settlement failed:', error)
  }
  try {
    await qualifyReferralForOrder(userId, orderId, qualifyingAmount)
  } catch (error) {
    console.error('[loyalty] referral reward settlement failed:', error)
  }
}

export async function safelyReleasePointsForOrder(orderId: string) {
  try {
    return await releasePointsForOrder(orderId)
  } catch (error) {
    console.error('[loyalty] points release failed:', error)
    return { released: false }
  }
}

export async function reservePointsForOrder(userId: string, orderId: string, requestedPoints: number) {
  const rules = await getLoyaltyRules()
  if (!rules.enabled) return { success: false, error: 'Loyalty rewards are currently unavailable.' }

  const requested = Math.max(0, Math.floor(Number(requestedPoints) || 0))
  if (requested === 0) return { success: false, error: 'Choose some points to use.' }

  const [order] = await db
    .select({ id: orders.id, userId: orders.userId, subtotal: orders.subtotal, total: orders.total, paymentStatus: orders.paymentStatus })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!order || order.userId !== userId) return { success: false, error: 'Order not found.' }
  if (order.paymentStatus !== 'pending') return { success: false, error: 'Points can only be used before payment is completed.' }

  const maximumDiscount = Math.floor((Number(order.subtotal) || 0) * (rules.redemptionCapPercent / 100))
  const maximumPoints = Math.floor(maximumDiscount / rules.redemptionUgxPerPoint)
  const points = Math.min(requested, maximumPoints)
  if (points <= 0) return { success: false, error: 'This order is not large enough for a points discount yet.' }

  const account = await getOrCreateLoyaltyAccount(userId)
  const discountUgx = points * rules.redemptionUgxPerPoint
  const result = await db.transaction(async (transaction) => {
    const ledgerResult = await applyLedgerDeltaInTransaction(transaction, {
      accountId: account.id,
      userId,
      points: -points,
      type: 'redemption_hold',
      eventKey: `redemption_hold:${order.id}`,
      description: `Points used on order ${order.id.slice(0, 8).toUpperCase()}`,
      orderId: order.id,
      metadata: { discountUgx },
      rules,
    })
    if (!ledgerResult.applied) return ledgerResult

    await transaction
      .update(orders)
      .set({
        discount: String(discountUgx),
        total: String(Math.max(0, (Number(order.total) || 0) - discountUgx)),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))

    return ledgerResult
  })

  return result.applied
    ? { success: true, points, discountUgx }
    : { success: false, error: 'Points have already been applied to this order.' }
}

export async function releasePointsForOrder(orderId: string) {
  const [order] = await db
    .select({ paymentStatus: orders.paymentStatus })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!order || order.paymentStatus === 'completed') return { released: false }

  const [hold] = await db
    .select({ userId: loyaltyTransactions.userId, accountId: loyaltyTransactions.accountId, points: loyaltyTransactions.points, orderId: loyaltyTransactions.orderId, metadata: loyaltyTransactions.metadata })
    .from(loyaltyTransactions)
    .where(and(eq(loyaltyTransactions.orderId, orderId), eq(loyaltyTransactions.type, 'redemption_hold')))
    .limit(1)
  if (!hold || hold.points >= 0) return { released: false }

  const discountUgx = Number((hold.metadata as { discountUgx?: number } | null)?.discountUgx ?? 0)
  const released = await applyLedgerDelta({
    accountId: hold.accountId,
    userId: hold.userId,
    points: Math.abs(hold.points),
    type: 'redemption_release',
    eventKey: `redemption_release:${orderId}`,
    description: 'Returned unused checkout points',
    orderId,
    rules: await getLoyaltyRules(),
  })

  if (released.applied) {
    const [order] = await db.select({ total: orders.total }).from(orders).where(eq(orders.id, orderId)).limit(1)
    if (order) {
      await db
        .update(orders)
        .set({ discount: '0', total: String((Number(order.total) || 0) + discountUgx), updatedAt: new Date() })
        .where(eq(orders.id, orderId))
    }
  }

  return { released: released.applied }
}

async function applyLedgerDelta({
  accountId,
  userId,
  points,
  type,
  eventKey,
  description,
  orderId,
  metadata,
  updateDailyClaimAt = false,
  rules,
}: {
  accountId?: string
  userId: string
  points: number
  type: LoyaltyEventType
  eventKey: string
  description: string
  orderId?: string
  metadata?: Record<string, unknown>
  updateDailyClaimAt?: boolean
  rules: LoyaltyRules
}) {
  const account = accountId ? { id: accountId } : await getOrCreateLoyaltyAccount(userId)
  return db.transaction((transaction) => applyLedgerDeltaInTransaction(transaction, {
    accountId: account.id,
    userId,
    points,
    type,
    eventKey,
    description,
    orderId,
    metadata,
    updateDailyClaimAt,
    rules,
  }))
}

async function applyLedgerDeltaInTransaction(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  {
    accountId,
    userId,
    points,
    type,
    eventKey,
    description,
    orderId,
    metadata,
    updateDailyClaimAt = false,
    rules,
  }: {
    accountId: string
    userId: string
    points: number
    type: LoyaltyEventType
    eventKey: string
    description: string
    orderId?: string
    metadata?: Record<string, unknown>
    updateDailyClaimAt?: boolean
    rules: LoyaltyRules
  },
) {
  if (!Number.isInteger(points) || points === 0) return { applied: false, points: 0, accountId }

  const [account] = await transaction
    .select({ id: loyaltyAccounts.id, balancePoints: loyaltyAccounts.balancePoints })
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.id, accountId))
    .limit(1)
  if (!account) throw new Error('Loyalty account not found.')
  if (points < 0 && account.balancePoints < Math.abs(points)) throw new Error('You do not have enough points for that reward.')

  const expiresAt = points > 0 && rules.pointsValidityDays > 0
    ? new Date(Date.now() + rules.pointsValidityDays * 24 * 60 * 60 * 1000)
    : null

  const [entry] = await transaction
    .insert(loyaltyTransactions)
    .values({
      accountId,
      userId,
      points,
      type,
      eventKey,
      description: description.slice(0, 255),
      orderId: orderId ?? null,
      metadata: metadata ?? {},
      expiresAt,
    })
    .onConflictDoNothing({ target: loyaltyTransactions.eventKey })
    .returning({ id: loyaltyTransactions.id })

  if (!entry) return { applied: false, points: 0, accountId }

  const balanceExpression = sql`${loyaltyAccounts.balancePoints} + ${points}`
  const earnedPoints = points > 0 && type !== 'redemption_release' && type !== 'expiration' ? points : 0
  const redeemedPoints = type === 'redemption_hold' ? Math.abs(points) : type === 'redemption_release' ? -Math.abs(points) : 0
  const earnedExpression = sql`${loyaltyAccounts.lifetimeEarned} + ${earnedPoints}`
  const redeemedExpression = sql`greatest(0, ${loyaltyAccounts.lifetimeRedeemed} + ${redeemedPoints})`
  const balanceGuard = points < 0
    ? and(eq(loyaltyAccounts.id, accountId), gte(loyaltyAccounts.balancePoints, Math.abs(points)))
    : eq(loyaltyAccounts.id, accountId)
  const updated = await transaction
    .update(loyaltyAccounts)
    .set({
      balancePoints: balanceExpression,
      lifetimeEarned: earnedExpression,
      lifetimeRedeemed: redeemedExpression,
      lastDailyClaimedAt: updateDailyClaimAt ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(balanceGuard)
    .returning({ id: loyaltyAccounts.id })
  if (updated.length === 0) throw new Error('You do not have enough points for that reward.')

  return { applied: true, points, accountId }
}

async function expirePointsForUser(accountId: string, userId: string, rules: LoyaltyRules) {
  if (rules.pointsValidityDays <= 0) return
  const expired = await db
    .select({ id: loyaltyTransactions.id, points: loyaltyTransactions.points })
    .from(loyaltyTransactions)
    .where(and(
      eq(loyaltyTransactions.accountId, accountId),
      gt(loyaltyTransactions.points, 0),
      lt(loyaltyTransactions.expiresAt, new Date()),
      sql`not exists (select 1 from loyalty_transactions expiry where expiry.event_key = concat('expiration:', ${loyaltyTransactions.id}))`,
    ))
    .orderBy(loyaltyTransactions.createdAt)
    .limit(50)
  if (expired.length === 0) return

  const [account] = await db
    .select({ balancePoints: loyaltyAccounts.balancePoints })
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.id, accountId))
    .limit(1)
  let available = account?.balancePoints ?? 0
  for (const entry of expired) {
    const points = Math.min(available, entry.points)
    if (points <= 0) break
    const result = await applyLedgerDelta({
      accountId,
      userId,
      points: -points,
      type: 'expiration',
      eventKey: `expiration:${entry.id}`,
      description: 'Expired rewards points',
      rules,
    })
    if (result.applied) available -= points
  }
}

export async function getLoyaltyAdminOverview() {
  const [summary] = await db
    .select({
      accountCount: sql<number>`count(*)`,
      availablePoints: sql<number>`coalesce(sum(${loyaltyAccounts.balancePoints}), 0)`,
      lifetimeEarned: sql<number>`coalesce(sum(${loyaltyAccounts.lifetimeEarned}), 0)`,
      lifetimeRedeemed: sql<number>`coalesce(sum(${loyaltyAccounts.lifetimeRedeemed}), 0)`,
    })
    .from(loyaltyAccounts)

  const [pendingReferrals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(loyaltyReferrals)
    .where(eq(loyaltyReferrals.status, 'pending'))

  const accounts = await db
    .select({
      userId: loyaltyAccounts.userId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      balancePoints: loyaltyAccounts.balancePoints,
    })
    .from(loyaltyAccounts)
    .innerJoin(users, eq(loyaltyAccounts.userId, users.id))
    .orderBy(users.email)
    .limit(100)

  const recentTransactions = await db
    .select({
      id: loyaltyTransactions.id,
      email: users.email,
      points: loyaltyTransactions.points,
      type: loyaltyTransactions.type,
      description: loyaltyTransactions.description,
      createdAt: loyaltyTransactions.createdAt,
    })
    .from(loyaltyTransactions)
    .innerJoin(users, eq(loyaltyTransactions.userId, users.id))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(50)

  return {
    rules: await getLoyaltyRules(),
    accounts,
    summary: {
      accountCount: Number(summary?.accountCount ?? 0),
      availablePoints: Number(summary?.availablePoints ?? 0),
      lifetimeEarned: Number(summary?.lifetimeEarned ?? 0),
      lifetimeRedeemed: Number(summary?.lifetimeRedeemed ?? 0),
      pendingReferrals: Number(pendingReferrals?.count ?? 0),
    },
    recentTransactions,
  }
}

export async function adjustLoyaltyPoints(userId: string, points: number, description: string) {
  const rules = await getLoyaltyRules()
  if (!rules.enabled || !Number.isInteger(points) || points === 0) return { applied: false, points: 0 }
  return applyLedgerDelta({
    userId,
    points,
    type: 'admin_adjustment',
    eventKey: `admin_adjustment:${crypto.randomUUID()}`,
    description: description.trim() || 'Admin points adjustment',
    rules,
  })
}

function loyaltyDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function createReferralCode() {
  return `REV-${crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`
}
