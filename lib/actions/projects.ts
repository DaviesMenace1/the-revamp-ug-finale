'use server'

import { db } from '@/lib/db/client'
import { projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createProject(data: {
  slug: string
  name: string
  client: string
  description: string
  shortDescription: string
  location: string
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  year: string
  features: string[]
  images: string[]
  dueDate: string
}) {
  try {
    await db.insert(projects).values({
      ...data,
      createdAt: new Date(),
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
    await db.update(projects).set(data).where(eq(projects.id, id))
    revalidatePath('/admin/projects')
    revalidatePath('/portfolio')
    revalidatePath(`/portfolio/${data.slug}`)
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
