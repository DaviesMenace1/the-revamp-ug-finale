'use server'

import { getCurrentUserWithRole } from '@/lib/auth/server'
import { saveSetting } from './settings'
import { adjustLoyaltyPoints, claimDailyLoginPoints, reservePointsForOrder } from '@/lib/loyalty/service'
import { LOYALTY_SETTING_KEY, normalizeLoyaltyRules, type LoyaltyRules } from '@/lib/loyalty/config'

export async function claimDailyLogin() {
  const authorization = await getCurrentUserWithRole()
  if (!authorization.authorized || !authorization.user) {
    return { success: false, error: 'Please sign in to claim daily points.' }
  }

  try {
    const result = await claimDailyLoginPoints(authorization.user.id)
    return { success: true, ...result }
  } catch (error) {
    console.error('[loyalty] daily claim failed:', error)
    return { success: false, error: 'Daily points are temporarily unavailable. Please try again.' }
  }
}

export async function redeemPointsAtCheckout(orderId: string, points: number) {
  const authorization = await getCurrentUserWithRole()
  if (!authorization.authorized || !authorization.user) {
    return { success: false, error: 'Please sign in before using points.' }
  }
  if (!orderId || !Number.isFinite(points)) {
    return { success: false, error: 'Choose a valid points amount.' }
  }

  try {
    return await reservePointsForOrder(authorization.user.id, orderId, points)
  } catch (error) {
    console.error('[loyalty] checkout redemption failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Points could not be applied.' }
  }
}

export async function adjustPointsAsAdmin(userId: string, points: number, description: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) {
    return { success: false, error: 'You are not authorized to adjust loyalty points.' }
  }
  if (!userId || !Number.isInteger(points) || points === 0 || description.trim().length < 3) {
    return { success: false, error: 'Provide a non-zero points amount and a reason.' }
  }

  try {
    const result = await adjustLoyaltyPoints(userId, points, description)
    return result.applied ? { success: true, points: result.points } : { success: false, error: 'The points adjustment could not be applied.' }
  } catch (error) {
    console.error('[loyalty] admin adjustment failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'The points adjustment could not be applied.' }
  }
}

export async function updateLoyaltyRules(value: Partial<LoyaltyRules>) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) {
    return { success: false, error: 'You are not authorized to change loyalty rules.' }
  }

  try {
    const rules = normalizeLoyaltyRules(value)
    const result = await saveSetting(LOYALTY_SETTING_KEY, rules)
    return result.success ? { success: true, rules } : result
  } catch (error) {
    console.error('[loyalty] rules update failed:', error)
    return { success: false, error: 'Loyalty rules could not be saved.' }
  }
}
