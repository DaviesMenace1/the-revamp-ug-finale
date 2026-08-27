import { and, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  categories,
  collectionPromotions,
  memberships,
  orderPromotionRedemptions,
  orders,
  products,
  subCategories,
  tradeMembers,
  users,
} from '@/lib/db/schema'

const ACTIVE_REDEMPTION_STATUSES = ['reserved', 'applied'] as const
const VALID_AUDIENCES = new Set(['all', 'new_customer', 'returning_customer', 'members'])
const VALID_TARGET_TYPES = new Set(['all', 'category', 'subcategory', 'collection', 'product', 'mixed'])

export type CollectionPromotionCartItem = {
  productId: string
  quantity: number
  unitPrice: number
}

export type CollectionPromotionQuote = {
  promotion: {
    id: string
    name: string
    code: string
    discountType: string
    discountValue: string
    maxDiscount: string | null
    audience: string
    stackable: boolean
  }
  discountAmount: number
  eligibleItemTotal: number
}

function normalizeCode(value: unknown) {
  const code = typeof value === 'string' ? value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : ''
  return code.slice(0, 40)
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim().toLowerCase()).filter(Boolean).slice(0, 200)
}

function roundMoney(value: number) {
  return Math.max(0, Math.round((value + Number.EPSILON) * 100) / 100)
}

function dateIsActive(startsAt: Date | null, endsAt: Date | null, now: Date) {
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt > now)
}

async function hasPriorOrder(userId: string) {
  const [owner] = await db.select({ clerkId: users.clerkId }).from(users).where(eq(users.id, userId)).limit(1)
  if (!owner) return false
  const [row] = await db.select({ id: orders.id }).from(orders).where(and(
    eq(orders.userId, owner.clerkId),
    or(eq(orders.paymentStatus, 'completed'), inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered'])),
  )).limit(1)
  return Boolean(row)
}

async function isMember(userId: string, now: Date) {
  const [membership] = await db.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.status, 'active'), or(isNull(memberships.endDate), gt(memberships.endDate, now)))).limit(1)
  if (membership) return true
  const [tradeMember] = await db.select({ id: tradeMembers.id }).from(tradeMembers).where(and(eq(tradeMembers.userId, userId), inArray(tradeMembers.status, ['active', 'approved']))).limit(1)
  return Boolean(tradeMember)
}

async function audienceIsEligible(audience: string, userId: string, now: Date) {
  if (!VALID_AUDIENCES.has(audience) || audience === 'all') return audience === 'all'
  if (audience === 'members') return isMember(userId, now)
  const hasOrder = await hasPriorOrder(userId)
  return audience === 'new_customer' ? !hasOrder : hasOrder
}

async function usageIsAvailable(promotionId: string, userId: string, totalUsageLimit: number | null, perCustomerLimit: number) {
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(orderPromotionRedemptions).where(and(eq(orderPromotionRedemptions.promotionId, promotionId), inArray(orderPromotionRedemptions.status, [...ACTIVE_REDEMPTION_STATUSES]))).limit(1)
  const [customer] = await db.select({ count: sql<number>`count(*)` }).from(orderPromotionRedemptions).where(and(eq(orderPromotionRedemptions.promotionId, promotionId), eq(orderPromotionRedemptions.userId, userId), inArray(orderPromotionRedemptions.status, [...ACTIVE_REDEMPTION_STATUSES]))).limit(1)
  const totalCount = Number(total?.count || 0)
  const customerCount = Number(customer?.count || 0)
  return (totalUsageLimit === null || totalCount < totalUsageLimit) && customerCount < Math.max(1, perCustomerLimit)
}

async function matchingProductIds(items: CollectionPromotionCartItem[], targetType: string, collectionSlugs: string[], productIds: string[]) {
  if (items.length === 0) return new Set<string>()
  const safeTargetType = VALID_TARGET_TYPES.has(targetType) ? targetType : 'mixed'
  if (safeTargetType === 'all' || (safeTargetType === 'mixed' && collectionSlugs.length === 0 && productIds.length === 0)) return new Set(items.map((item) => item.productId))
  if (safeTargetType === 'product') return new Set(items.filter((item) => productIds.includes(item.productId)).map((item) => item.productId))
  if (collectionSlugs.length === 0) return new Set<string>()

  const ids = [...new Set(items.map((item) => item.productId))]
  const rows = await db.select({ id: products.id, categorySlug: categories.slug, subCategorySlug: subCategories.slug }).from(products).innerJoin(subCategories, eq(products.subCategoryId, subCategories.id)).innerJoin(categories, eq(subCategories.categoryId, categories.id)).where(inArray(products.id, ids))
  const targetProductIds = new Set(productIds)
  return new Set(rows.filter((row) => {
    if (safeTargetType === 'category') return collectionSlugs.includes(row.categorySlug.toLowerCase())
    if (safeTargetType === 'subcategory') return collectionSlugs.includes(row.subCategorySlug.toLowerCase())
    if (safeTargetType === 'collection') return collectionSlugs.includes(row.categorySlug.toLowerCase()) || collectionSlugs.includes(row.subCategorySlug.toLowerCase())
    return targetProductIds.has(row.id) || collectionSlugs.includes(row.categorySlug.toLowerCase()) || collectionSlugs.includes(row.subCategorySlug.toLowerCase())
  }).map((row) => row.id))
}

export async function getCollectionPromotionQuote(input: { userId: string; code: unknown; items: CollectionPromotionCartItem[] }) {
  const code = normalizeCode(input.code)
  if (!code) return { success: false as const, error: 'Enter a collection promo code.' }
  const [promotion] = await db.select().from(collectionPromotions).where(eq(collectionPromotions.code, code)).limit(1)
  if (!promotion) return { success: false as const, error: 'That collection promo code is not recognised.' }
  const now = new Date()
  if (promotion.status !== 'active' || !dateIsActive(promotion.startsAt, promotion.endsAt, now)) return { success: false as const, error: 'That collection promo code is not active.' }
  if (!(await audienceIsEligible(promotion.audience, input.userId, now))) return { success: false as const, error: 'This collection promo code is not available for your account.' }
  if (!(await usageIsAvailable(promotion.id, input.userId, promotion.totalUsageLimit, promotion.perCustomerLimit))) return { success: false as const, error: 'That collection promo code has reached its usage limit.' }

  const qualifyingIds = await matchingProductIds(input.items, promotion.targetType, stringArray(promotion.collectionSlugs), stringArray(promotion.productIds))
  const eligibleItemTotal = roundMoney(input.items.reduce((sum, item) => qualifyingIds.has(item.productId) ? sum + Math.max(0, item.unitPrice) * item.quantity : sum, 0))
  if (eligibleItemTotal <= 0) return { success: false as const, error: 'This collection promo code does not apply to the items in your cart.' }

  const value = Number(promotion.discountValue)
  const maxDiscount = Number(promotion.maxDiscount)
  const rawDiscount = promotion.discountType === 'fixed' ? value : eligibleItemTotal * (value / 100)
  const discountAmount = roundMoney(Math.min(eligibleItemTotal, Number.isFinite(maxDiscount) && maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount))
  if (!Number.isFinite(discountAmount) || discountAmount <= 0) return { success: false as const, error: 'This collection promo code does not provide a valid discount.' }

  return {
    success: true as const,
    quote: {
      promotion: { id: promotion.id, name: promotion.name, code: promotion.code, discountType: promotion.discountType, discountValue: String(promotion.discountValue), maxDiscount: promotion.maxDiscount ? String(promotion.maxDiscount) : null, audience: promotion.audience, stackable: promotion.stackable },
      discountAmount,
      eligibleItemTotal,
    } satisfies CollectionPromotionQuote,
  }
}

export async function reserveCollectionPromotion(input: { userId: string; orderId: string; code: unknown; items: CollectionPromotionCartItem[] }) {
  const quote = await getCollectionPromotionQuote({ userId: input.userId, code: input.code, items: input.items })
  if (!quote.success) return quote

  const result = await db.transaction(async (transaction) => {
    await transaction.execute(sql`select ${collectionPromotions.id} from ${collectionPromotions} where ${collectionPromotions.id} = ${quote.quote.promotion.id} for update`)
    const now = new Date()
    const [promotion] = await transaction.select().from(collectionPromotions).where(eq(collectionPromotions.id, quote.quote.promotion.id)).limit(1)
    if (!promotion || promotion.status !== 'active' || !dateIsActive(promotion.startsAt, promotion.endsAt, now)) return { success: false as const, error: 'That collection promo code is no longer active.' }
    const [total] = await transaction.select({ count: sql<number>`count(*)` }).from(orderPromotionRedemptions).where(and(eq(orderPromotionRedemptions.promotionId, promotion.id), inArray(orderPromotionRedemptions.status, [...ACTIVE_REDEMPTION_STATUSES]))).limit(1)
    const [customer] = await transaction.select({ count: sql<number>`count(*)` }).from(orderPromotionRedemptions).where(and(eq(orderPromotionRedemptions.promotionId, promotion.id), eq(orderPromotionRedemptions.userId, input.userId), inArray(orderPromotionRedemptions.status, [...ACTIVE_REDEMPTION_STATUSES]))).limit(1)
    if ((promotion.totalUsageLimit !== null && Number(total?.count || 0) >= promotion.totalUsageLimit) || Number(customer?.count || 0) >= Math.max(1, promotion.perCustomerLimit)) return { success: false as const, error: 'That collection promo code has just reached its usage limit. Please try again without it.' }
    const [redemption] = await transaction.insert(orderPromotionRedemptions).values({ promotionId: promotion.id, orderId: input.orderId, userId: input.userId, code: promotion.code, discountAmount: quote.quote.discountAmount.toFixed(2), status: 'reserved' }).onConflictDoNothing({ target: orderPromotionRedemptions.orderId }).returning({ id: orderPromotionRedemptions.id })
    if (!redemption) return { success: false as const, error: 'A promotion is already attached to this order.' }
    return { success: true as const, quote: quote.quote }
  })
  return result
}

export async function markCollectionPromotionApplied(orderId: string) {
  await db.update(orderPromotionRedemptions).set({ status: 'applied', appliedAt: new Date(), updatedAt: new Date() }).where(and(eq(orderPromotionRedemptions.orderId, orderId), eq(orderPromotionRedemptions.status, 'reserved')))
}

export async function releaseCollectionPromotionForOrder(orderId: string) {
  await db.update(orderPromotionRedemptions).set({ status: 'released', releasedAt: new Date(), updatedAt: new Date() }).where(and(eq(orderPromotionRedemptions.orderId, orderId), inArray(orderPromotionRedemptions.status, ['reserved', 'applied'])))
}

export function collectionPromotionIsStackable(quote: CollectionPromotionQuote) {
  return quote.promotion.stackable
}
