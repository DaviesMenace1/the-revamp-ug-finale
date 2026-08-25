'use server'

import { db } from '@/lib/db/client'
import { consultations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { awardConsultationPoints } from '@/lib/loyalty/service'

const VALID_STATUSES = ['pending', 'scheduled', 'completed', 'cancelled']

export async function updateConsultationStatus(id: string, status: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'You are not authorized to update consultations.' }
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: 'Invalid status.' }
  }

  try {
    const [consultation] = await db
      .select({ userId: consultations.userId })
      .from(consultations)
      .where(eq(consultations.id, id))
      .limit(1)
    if (!consultation) return { success: false, error: 'Consultation not found.' }

    await db
      .update(consultations)
      .set({ status, updatedAt: new Date() })
      .where(eq(consultations.id, id))

    if (status === 'completed') void awardConsultationPoints(consultation.userId, id)
    revalidatePath('/admin/consultations')
    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    console.error('Failed to update consultation status:', error)
    return { success: false, error: 'Failed to update consultation status.' }
  }
}

export async function updateConsultationNotes(id: string, notes: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'You are not authorized to update consultation notes.' }
  try {
    await db
      .update(consultations)
      .set({ notes, updatedAt: new Date() })
      .where(eq(consultations.id, id))

    revalidatePath('/admin/consultations')
    return { success: true }
  } catch (error) {
    console.error('Failed to update consultation notes:', error)
    return { success: false, error: 'Failed to update notes.' }
  }
}

export async function deleteConsultation(id: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'You are not authorized to delete consultations.' }
  try {
    await db.delete(consultations).where(eq(consultations.id, id))
    revalidatePath('/admin/consultations')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete consultation:', error)
    return { success: false, error: 'Failed to delete consultation.' }
  }
}
