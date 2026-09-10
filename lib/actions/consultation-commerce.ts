'use server'

import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { consultationPromotions } from '@/lib/db/schema'
import { getCurrentUserWithRole } from '@/lib/auth/server'

const DISCOUNT_TYPES = new Set(['percentage', 'fixed'])
const AUDIENCES = new Set(['all', 'new_customer', 'returning_customer', 'members'])
const STATUSES = new Set(['draft', 'scheduled', 'active', 'paused', 'expired', 'archived'])

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

function parseServiceTypes(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 20)
  return text(value, 500).split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20)
}

export async function listConsultationPromotions() {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return []
  try {
    const rows = await db.select().from(consultationPromotions).orderBy(desc(consultationPromotions.createdAt)).limit(100)
    return rows.map((row) => ({ ...row, startsAt: row.startsAt?.toISOString() || null, endsAt: row.endsAt?.toISOString() || null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }))
  } catch (error) {
    console.error('[consultation-promotions] failed to list:', error)
    return []
  }
}

export async function createConsultationPromotion(input: {
  name: string
  code?: string
  discountType: string
  discountValue: string
  maxDiscount?: string
  serviceTypes: string
  audience: string
  startsAt?: string
  endsAt?: string
  totalUsageLimit?: string
  perCustomerLimit?: string
  status: string
}) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'Only administrators can manage consultation promotions.' }
  try {
    const name = text(input.name, 160)
    const code = normalizeCode(input.code)
    const discountType = text(input.discountType, 20)
    const discountValue = number(input.discountValue)
    const maxDiscount = text(input.maxDiscount, 40) ? number(input.maxDiscount) : null
    const audience = text(input.audience, 30)
    const status = text(input.status, 20)
    const startsAt = parseDate(input.startsAt)
    const endsAt = parseDate(input.endsAt)
    const totalUsageLimit = text(input.totalUsageLimit, 20) ? Math.max(1, Math.floor(number(input.totalUsageLimit))) : null
    const perCustomerLimit = Math.max(1, Math.floor(number(input.perCustomerLimit, 1)))
    if (!name) return { success: false, error: 'Give the promotion a name.' }
    if (code && code.length < 3) return { success: false, error: 'Promotion codes must be at least 3 characters.' }
    if (!DISCOUNT_TYPES.has(discountType)) return { success: false, error: 'Choose percentage or fixed discount.' }
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100)) return { success: false, error: discountType === 'percentage' ? 'Percentage must be between 1 and 100.' : 'Fixed discount must be greater than zero.' }
    if (maxDiscount !== null && maxDiscount <= 0) return { success: false, error: 'Maximum discount must be greater than zero.' }
    if (!AUDIENCES.has(audience)) return { success: false, error: 'Choose a valid promotion audience.' }
    if (!STATUSES.has(status)) return { success: false, error: 'Choose a valid promotion status.' }
    if (startsAt && endsAt && endsAt <= startsAt) return { success: false, error: 'The end date must be after the start date.' }

    await db.insert(consultationPromotions).values({
      name,
      code,
      discountType,
      discountValue: discountValue.toFixed(2),
      maxDiscount: maxDiscount === null ? null : maxDiscount.toFixed(2),
      serviceTypes: parseServiceTypes(input.serviceTypes),
      audience,
      startsAt,
      endsAt,
      totalUsageLimit,
      perCustomerLimit,
      status,
      createdBy: authorization.user.id,
    })
    revalidatePath('/admin/settings')
    revalidatePath('/book-consultation')
    return { success: true }
  } catch (error) {
    console.error('[consultation-promotions] failed to create:', error)
    return { success: false, error: 'Could not save that promotion. Check that its code is unique.' }
  }
}

export async function updateConsultationPromotionStatus(id: string, status: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'Only administrators can manage consultation promotions.' }
  if (!STATUSES.has(status) || !id) return { success: false, error: 'Choose a valid promotion status.' }
  try {
    await db.update(consultationPromotions).set({ status, updatedAt: new Date() }).where(eq(consultationPromotions.id, id))
    revalidatePath('/admin/settings')
    revalidatePath('/book-consultation')
    return { success: true }
  } catch (error) {
    console.error('[consultation-promotions] failed to update:', error)
    return { success: false, error: 'Could not update that promotion.' }
  }
}
