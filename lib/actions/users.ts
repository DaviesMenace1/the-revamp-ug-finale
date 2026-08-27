'use server'

import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdminPermission } from '@/lib/auth/admin-guard'
import type { UserRole } from '@/lib/auth/permissions'

export const VALID_ROLES = [
  'customer',
  'designer',
  'admin',
  'trade_member',
  'architect',
  'interior_designer',
  'editor',
  'operations_manager',
  'logistics_coordinator',
  'support_agent',
  'finance_viewer',
] as const satisfies readonly UserRole[]

export async function updateUserRole(userId: string, role: string) {
  const currentUser = await requireAdminPermission('manage_staff', '/admin/users')
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { success: false, error: 'Invalid user.' }
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) return { success: false, error: 'Invalid role.' }
  if (userId === currentUser.id && role !== 'admin') return { success: false, error: 'You cannot remove your own administrator access.' }

  try {
    const updated = await db
      .update(users)
      .set({ role: role as (typeof VALID_ROLES)[number], updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id, role: users.role })

    if (updated.length === 0) return { success: false, error: 'That user no longer exists. Refresh the user list and try again.' }
    revalidatePath('/admin/users')
    return { success: true, role: updated[0].role || 'customer' }
  } catch (error) {
    console.error('Failed to update user role:', error)
    return { success: false, error: 'Failed to update user role.' }
  }
}

export async function deleteUser(userId: string) {
  const currentUser = await requireAdminPermission('manage_staff', '/admin/users')
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { success: false, error: 'Invalid user.' }
  if (userId === currentUser.id) return { success: false, error: 'You cannot delete your own account from this screen.' }
  try {
    await db.delete(users).where(eq(users.id, userId))
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user:', error)
    return { success: false, error: 'Failed to delete user.' }
  }
}
