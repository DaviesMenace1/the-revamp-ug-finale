'use server'

import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { categories, collectionPromotions, products, subCategories } from '@/lib/db/schema'
import { getCurrentUserWithRole } from '@/lib/auth/server'

const DISCOUNT_TYPES = new Set(['percentage', 'fixed'])
const AUDIENCES = new Set(['all', 'new_customer', 'returning_customer', 'members'])
const STATUSES = new Set(['draft', 'scheduled', 'active', 'paused', 'expired', 'archived'])
const TARGET_TYPES = new Set(['all', 'category', 'subcategory', 'collection', 'product', 'mixed'])

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseDate(value: unknown) {
  const raw = text(value, 40)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isFinite(date.getTime()) ? date : null
}

function normalizeCode(value: unknown) {
  const code = text(value, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, '')
  return code || null
}

function parseList(value: unknown, maxItems = 200) {
  const values = Array.isArray(value) ? value : text(value, 4000).split(',')
  return values.filter((item): item is string => typeof item === 'string').map((item) => item.trim().toLowerCase()).filter(Boolean).slice(0, maxItems)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function validatePromotionTargets(targetType: string, collectionSlugs: string[], productIds: string[]) {
  if (targetType === 'all' || targetType === 'mixed') return null
  if (targetType === 'product') {
    if (productIds.some((id) => !isUuid(id))) return 'Product-targeted promotions require valid product IDs.'
    const rows = await db.select({ id: products.id }).from(products).where(and(inArray(products.id, productIds), eq(products.status, 'published')))
    return rows.length === productIds.length ? null : 'Select only published products for this promotion.'
  }
  if (targetType === 'category') {
    const rows = await db.select({ slug: categories.slug }).from(categories).where(and(inArray(categories.slug, collectionSlugs), eq(categories.active, true), eq(categories.isActive, true)))
    return new Set(rows.map((row) => row.slug)).size === new Set(collectionSlugs).size ? null : 'Select only active published categories.'
  }
  if (targetType === 'subcategory') {
    const rows = await db.select({ slug: subCategories.slug }).from(subCategories).where(and(inArray(subCategories.slug, collectionSlugs), eq(subCategories.active, true), eq(subCategories.isActive, true)))
    return new Set(rows.map((row) => row.slug)).size === new Set(collectionSlugs).size ? null : 'Select only active published subcategories.'
  }
  if (targetType === 'collection') {
    const categoryRows = await db.select({ slug: categories.slug }).from(categories).where(and(inArray(categories.slug, collectionSlugs), eq(categories.active, true), eq(categories.isActive, true)))
    const subcategoryRows = await db.select({ slug: subCategories.slug }).from(subCategories).where(and(inArray(subCategories.slug, collectionSlugs), eq(subCategories.active, true), eq(subCategories.isActive, true)))
    const validSlugs = new Set([...categoryRows, ...subcategoryRows].map((row) => row.slug))
    return validSlugs.size === new Set(collectionSlugs).size ? null : 'Select only existing active category or subcategory slugs.'
  }
  return 'Choose a valid promotion target.'
}

export async function listCollectionPromotions() {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return []
  try {
    const rows = await db.select().from(collectionPromotions).orderBy(desc(collectionPromotions.createdAt)).limit(100)
    return rows.map((row) => ({ ...row, startsAt: row.startsAt?.toISOString() || null, endsAt: row.endsAt?.toISOString() || null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }))
  } catch (error) {
    console.error('[collection-promotions] failed to list:', error)
    return []
  }
}

export async function createCollectionPromotion(input: {
  name: string
  code: string
  discountType: string
  discountValue: string
  maxDiscount?: string
  targetType?: string
  collectionSlugs?: string
  productIds?: string
  audience: string
  startsAt?: string
  endsAt?: string
  totalUsageLimit?: string
  perCustomerLimit?: string
  status: string
  stackable?: boolean
}) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'Only administrators can manage collection promotions.' }
  try {
    const name = text(input.name, 160)
    const code = normalizeCode(input.code)
    const discountType = text(input.discountType, 20)
    const discountValue = number(input.discountValue)
    const maxDiscount = text(input.maxDiscount, 40) ? number(input.maxDiscount) : null
    const targetType = text(input.targetType, 20) || 'all'
    const collectionSlugs = parseList(input.collectionSlugs)
    const productIds = parseList(input.productIds)
    const audience = text(input.audience, 30)
    const status = text(input.status, 20)
    const startsAt = parseDate(input.startsAt)
    const endsAt = parseDate(input.endsAt)
    const totalUsageLimit = text(input.totalUsageLimit, 20) ? Math.max(1, Math.floor(number(input.totalUsageLimit))) : null
    const perCustomerLimit = Math.max(1, Math.floor(number(input.perCustomerLimit, 1)))
    if (!name) return { success: false, error: 'Give the collection promotion a name.' }
    if (!code || code.length < 3) return { success: false, error: 'Collection promo codes must be at least 3 characters.' }
    if (!DISCOUNT_TYPES.has(discountType)) return { success: false, error: 'Choose percentage or fixed discount.' }
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100)) return { success: false, error: discountType === 'percentage' ? 'Percentage must be between 1 and 100.' : 'Fixed discount must be greater than zero.' }
    if (maxDiscount !== null && maxDiscount <= 0) return { success: false, error: 'Maximum discount must be greater than zero.' }
    if (!AUDIENCES.has(audience)) return { success: false, error: 'Choose a valid promotion audience.' }
    if (!TARGET_TYPES.has(targetType)) return { success: false, error: 'Choose a valid promotion target.' }
    if (!STATUSES.has(status)) return { success: false, error: 'Choose a valid promotion status.' }
    if (startsAt && endsAt && endsAt <= startsAt) return { success: false, error: 'The end date must be after the start date.' }
    if (targetType === 'all' && (collectionSlugs.length > 0 || productIds.length > 0)) return { success: false, error: 'An all-products promotion cannot include category or product targets.' }
    if (['category', 'subcategory', 'collection'].includes(targetType) && collectionSlugs.length === 0) return { success: false, error: 'Select at least one category, subcategory, or collection slug.' }
    if (targetType === 'product' && productIds.length === 0) return { success: false, error: 'Add at least one product ID for a product-targeted promotion.' }
    const targetError = await validatePromotionTargets(targetType, collectionSlugs, productIds)
    if (targetError) return { success: false, error: targetError }

    await db.insert(collectionPromotions).values({
      name,
      code,
      discountType,
      discountValue: discountValue.toFixed(2),
      maxDiscount: maxDiscount === null ? null : maxDiscount.toFixed(2),
      targetType,
      collectionSlugs,
      productIds,
      audience,
      startsAt,
      endsAt,
      totalUsageLimit,
      perCustomerLimit,
      status,
      stackable: input.stackable === true,
      createdBy: authorization.user.id,
    })
    revalidatePath('/admin/settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch (error) {
    console.error('[collection-promotions] failed to create:', error)
    return { success: false, error: 'Could not save that collection promotion. Check that its code is unique.' }
  }
}

export async function updateCollectionPromotionStatus(id: string, status: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'Only administrators can manage collection promotions.' }
  if (!STATUSES.has(status) || !id) return { success: false, error: 'Choose a valid promotion status.' }
  try {
    await db.update(collectionPromotions).set({ status, updatedAt: new Date() }).where(eq(collectionPromotions.id, id))
    revalidatePath('/admin/settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch (error) {
    console.error('[collection-promotions] failed to update:', error)
    return { success: false, error: 'Could not update that collection promotion.' }
  }
}
