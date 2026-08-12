'use server'

import { db } from '@/lib/db/client'
import { projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createProject(data: {
  title: string
  slug: string
  description?: string
  longDescription?: string
  category?: string
  clientName?: string
  location?: string
  images?: string[]
  thumbnailImage?: string
  featured?: boolean
}) {
  try {
    await db.insert(projects).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    revalidatePath('/admin/projects')
    revalidatePath('/portfolio')
    return { success: true }
  } catch (error) {
    console.error('Failed to create project:', error)
    return { success: false, error: 'Failed to create project' }
  }
}

export async function updateProject(id: string, data: Partial<typeof projects.$inferSelect>) {
  try {
    await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id))
    revalidatePath('/admin/projects')
    revalidatePath('/portfolio')
    return { success: true }
  } catch (error) {
    console.error('Failed to update project:', error)
    return { success: false, error: 'Failed to update project' }
  }
}

export async function deleteProject(id: string) {
  try {
    await db.delete(projects).where(eq(projects.id, id))
    revalidatePath('/admin/projects')
    revalidatePath('/portfolio')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete project:', error)
    return { success: false, error: 'Failed to delete project' }
  }
}
