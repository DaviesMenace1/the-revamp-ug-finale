'use server'

import { db } from '@/lib/db/client'
import { projectTasks, projectActivity, projects } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'

export async function createTask(data: {
  projectId: string
  title: string
  description?: string
  assignedTo: 'client' | 'admin'
  dueDate?: string | null
}) {
  if (!data.title.trim()) return { success: false, error: 'Title is required.' }

  try {
    const admin = await getOrCreateCurrentUser()

    const [task] = await db
      .insert(projectTasks)
      .values({
        projectId: data.projectId,
        title: data.title,
        description: data.description || null,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdBy: admin?.id || null,
      })
      .returning()

    await db.insert(projectActivity).values({
      projectId: data.projectId,
      actorUserId: admin?.id || null,
      actorType: 'admin',
      action: 'task_created',
      summary: `New task: ${data.title}`,
    })

    revalidatePath(`/admin/client-projects/${data.projectId}`)
    return { success: true, task }
  } catch (error) {
    console.error('Failed to create task:', error)
    return { success: false, error: 'Failed to create task.' }
  }
}

export async function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'done') {
  try {
    const task = await db.query.projectTasks.findFirst({ where: eq(projectTasks.id, taskId) })
    if (!task) return { success: false, error: 'Task not found.' }

    await db
      .update(projectTasks)
      .set({
        status,
        completedAt: status === 'done' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(projectTasks.id, taskId))

    const user = await getOrCreateCurrentUser()
    if (status === 'done') {
      await db.insert(projectActivity).values({
        projectId: task.projectId,
        actorUserId: user?.id || null,
        actorType: task.assignedTo === 'client' ? 'client' : 'admin',
        action: 'task_completed',
        summary: `Task completed: ${task.title}`,
      })
    }

    revalidatePath(`/admin/client-projects/${task.projectId}`)
    revalidatePath(`/client/projects`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update task:', error)
    return { success: false, error: 'Failed to update task.' }
  }
}

export async function deleteTask(taskId: string) {
  try {
    const task = await db.query.projectTasks.findFirst({ where: eq(projectTasks.id, taskId) })
    if (!task) return { success: false, error: 'Task not found.' }

    await db.delete(projectTasks).where(eq(projectTasks.id, taskId))
    revalidatePath(`/admin/client-projects/${task.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete task:', error)
    return { success: false, error: 'Failed to delete task.' }
  }
}

// --- Client-side: only allowed to toggle tasks on a project they own ---

export async function toggleClientTask(taskId: string, done: boolean) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }

  try {
    const task = await db.query.projectTasks.findFirst({ where: eq(projectTasks.id, taskId) })
    if (!task) return { success: false, error: 'Task not found.' }

    const project = await db.query.projects.findFirst({ where: eq(projects.id, task.projectId) })
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Not authorized.' }
    }

    const status = done ? 'done' : 'pending'

    await db
      .update(projectTasks)
      .set({ status, completedAt: done ? new Date() : null, updatedAt: new Date() })
      .where(eq(projectTasks.id, taskId))

    await db.insert(projectActivity).values({
      projectId: task.projectId,
      actorUserId: user.id,
      actorType: 'client',
      action: done ? 'task_completed' : 'task_reopened',
      summary: `${done ? 'Completed' : 'Reopened'} task: ${task.title}`,
    })

    revalidatePath(`/client/projects/${project.slug}`)
    revalidatePath(`/admin/client-projects/${task.projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to toggle task:', error)
    return { success: false, error: 'Failed to update task.' }
  }
}