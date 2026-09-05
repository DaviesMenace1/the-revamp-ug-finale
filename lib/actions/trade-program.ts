'use server'

import { desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { tradeMembers, users } from '@/lib/db/schema'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { requireAdminPermission } from '@/lib/auth/admin-guard'

const QUALIFYING_GROUPS = new Set(['interior_designer', 'architect', 'real_estate_developer', 'hospitality', 'property_professional', 'other_design_professional'])
const REVIEW_STATUSES = new Set(['pending', 'approved', 'rejected'])

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function submitTradeApplication(input: Record<string, unknown>) {
  const authorization = await getCurrentUserWithRole()
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'Please sign in before applying for trade access.' }

  const businessName = text(input.businessName, 255)
  const businessCategory = text(input.businessCategory, 100)
  const tradeType = text(input.tradeType, 100)
  const taxNumber = text(input.taxNumber, 50)
  const businessLicense = text(input.businessLicense, 500)
  const certificate = text(input.certificate, 500)
  if (!businessName || !QUALIFYING_GROUPS.has(businessCategory)) return { success: false, error: 'Enter your practice name and choose a qualifying professional group.' }

  const existing = await db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, authorization.user.id) })
  const values = { businessName, businessCategory, tradeType: tradeType || null, taxNumber: taxNumber || null, businessLicense: businessLicense || null, certificate: certificate || null, status: 'pending', updatedAt: new Date() }
  if (existing) {
    await db.update(tradeMembers).set(values).where(eq(tradeMembers.id, existing.id))
  } else {
    await db.insert(tradeMembers).values({ userId: authorization.user.id, ...values })
  }

  revalidatePath('/trade-program')
  return { success: true }
}

export async function reviewTradeApplication(input: { id: string; status: string; tier: string; discountRate: number }) {
  const admin = await requireAdminPermission('manage_staff', '/admin/trade-applications')
  if (!REVIEW_STATUSES.has(input.status)) return { success: false, error: 'Choose a valid application status.' }
  const discountRate = Number(input.discountRate)
  if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) return { success: false, error: 'Discount must be between 0 and 100 percent.' }

  const [member] = await db.select({ id: tradeMembers.id, userId: tradeMembers.userId }).from(tradeMembers).where(eq(tradeMembers.id, input.id)).limit(1)
  if (!member) return { success: false, error: 'Trade application not found.' }

  const now = new Date()
  await db.transaction(async (transaction) => {
    await transaction.update(tradeMembers).set({ status: input.status, tier: text(input.tier, 50) || 'approved', discountRate: discountRate.toFixed(2), approvedAt: input.status === 'approved' ? now : null, updatedAt: now }).where(eq(tradeMembers.id, member.id))
    if (input.status === 'approved') {
      await transaction.update(users).set({ role: 'trade_member', updatedAt: now }).where(eq(users.id, member.userId))
    }
  })

  revalidatePath('/admin/trade-applications')
  revalidatePath('/trade')
  revalidatePath('/trade/collections')
  revalidatePath('/trade/pricing')
  return { success: true, reviewer: admin.id }
}

export async function getTradeApplications() {
  await requireAdminPermission('manage_staff', '/admin/trade-applications')
  const rows = await db
    .select({
      id: tradeMembers.id,
      userId: tradeMembers.userId,
      businessName: tradeMembers.businessName,
      businessCategory: tradeMembers.businessCategory,
      tradeType: tradeMembers.tradeType,
      taxNumber: tradeMembers.taxNumber,
      businessLicense: tradeMembers.businessLicense,
      certificate: tradeMembers.certificate,
      status: tradeMembers.status,
      tier: tradeMembers.tier,
      discountRate: tradeMembers.discountRate,
      appliedAt: tradeMembers.appliedAt,
      approvedAt: tradeMembers.approvedAt,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(tradeMembers)
    .leftJoin(users, eq(users.id, tradeMembers.userId))
    .where(inArray(tradeMembers.status, ['pending', 'approved', 'rejected']))
    .orderBy(desc(tradeMembers.appliedAt))
    .limit(200)
  return rows
}
