'use server'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'

const VALID_ROLES = [
  'customer',
  'designer',
  'admin',
  'trade_member',
  'architect',
  'interior_designer',
] as const

export async function updateUserRole(userId: string, role: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to manage users.' }
  if (!VALID_ROLES.includes(role as any)) {
    return { success: false, error: 'Invalid role.' }
  }

  try {
    await db
      .update(users)
      .set({ role: role as (typeof VALID_ROLES)[number], updatedAt: new Date() })
      .where(eq(users.id, userId))

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to update user role:', error)
    return { success: false, error: 'Failed to update user role.' }
  }
}

export async function deleteUser(userId: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to manage users.' }
  try {
    await db.delete(users).where(eq(users.id, userId))
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user:', error)
    return { success: false, error: 'Failed to delete user.' }
  }
}
