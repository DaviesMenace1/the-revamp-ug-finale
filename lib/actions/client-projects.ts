'use server'

import { db } from '@/lib/db/client'
import { projects, projectActivity } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'

const PHASE_LABELS: Record<string, string> = {
  consultation: 'Briefing & discovery',
  concept: 'Concept direction',
  design: 'Design development',
  visualization: '3D visualization',
  approval: 'Client approval',
  procurement: 'Procurement',
  installation: 'Installation',
  handover: 'Handover',
}

function slugify(input: string) {

  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function createClientProject(data: {
  title: string
  userId: string
  description?: string
  location?: string
  budget?: string
  designer?: string
  dueDate?: string | null
}) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to create client projects.' }
  if (!data.title.trim()) return { success: false, error: 'Title is required.' }
  if (!data.userId) return { success: false, error: 'A client must be selected.' }

  try {
    const [project] = await db
      .insert(projects)
      .values({
        title: data.title,
        slug: `${slugify(data.title)}-${Date.now().toString(36)}`,
        projectKind: 'client',
        userId: data.userId,
        description: data.description || null,
        location: data.location || null,
        budget: data.budget || null,
        designer: data.designer || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'consultation_scheduled',
        currentPhase: 'consultation',
        progress: 0,
      })
      .returning()

    const admin = await getOrCreateCurrentUser()

    await db.insert(projectActivity).values({
      projectId: project.id,
      actorUserId: admin?.id || null,
      actorType: 'admin',
      action: 'project_created',
      summary: `Project "${project.title}" was created`,
    })

    revalidatePath('/admin/client-projects')
    return { success: true, project }
  } catch (error) {
    console.error('Failed to create client project:', error)
    return { success: false, error: 'Failed to create client project.' }
  }
}

export async function updateClientProject(
  id: string,
  data: Partial<{
    title: string
    description: string
    location: string
    budget: string
    designer: string
    status: string
    currentPhase: string
    progress: number
    dueDate: string | null
  }>,
) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to update client projects.' }
  try {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.projectKind, 'client')),
    })
    if (!project) return { success: false, error: 'Client project not found.' }

    const patch: Record<string, unknown> = { ...data, updatedAt: new Date() }
    if (data.dueDate !== undefined) {
      patch.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }

    await db.update(projects).set(patch).where(eq(projects.id, id))

    if (data.currentPhase && data.currentPhase !== project.currentPhase) {
      const admin = await getOrCreateCurrentUser()
      await db.insert(projectActivity).values({
        projectId: id,
        actorUserId: admin?.id || null,
        actorType: 'admin',
        action: 'phase_changed',
                summary: `Project phase moved to ${PHASE_LABELS[data.currentPhase] ?? data.currentPhase.replaceAll('_', ' ')}`,

      })
    }

    revalidatePath('/admin/client-projects')
    revalidatePath(`/admin/client-projects/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update client project:', error)
    return { success: false, error: 'Failed to update client project.' }
  }
}

export async function deleteClientProject(id: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to delete client projects.' }
  try {
    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.projectKind, 'client')))
    revalidatePath('/admin/client-projects')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete client project:', error)
    return { success: false, error: 'Failed to delete client project.' }
  }
}