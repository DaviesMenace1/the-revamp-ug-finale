'use server'

import { db } from '@/lib/db/client'
import { consultations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const VALID_STATUSES = ['pending', 'scheduled', 'completed', 'cancelled']

export async function updateConsultationStatus(id: string, status: string) {
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: 'Invalid status.' }
  }

  try {
    await db
      .update(consultations)
      .set({ status, updatedAt: new Date() })
      .where(eq(consultations.id, id))

    revalidatePath('/admin/consultations')
    return { success: true }
  } catch (error) {
    console.error('Failed to update consultation status:', error)
    return { success: false, error: 'Failed to update consultation status.' }
  }
}

export async function updateConsultationNotes(id: string, notes: string) {
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
  try {
    await db.delete(consultations).where(eq(consultations.id, id))
    revalidatePath('/admin/consultations')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete consultation:', error)
    return { success: false, error: 'Failed to delete consultation.' }
  }
}
