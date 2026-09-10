'use server'

import { db } from '@/lib/db/client'
import { projectAssets, projectAssetComments, projectActivity, projectMembers, projectNotes, projects } from '@/lib/db/schema'

import { and, desc, eq } from 'drizzle-orm'

import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'

const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const

async function assertClientOwnsProject(assetId: string) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { user: null, asset: null, project: null }

  const asset = await db.query.projectAssets.findFirst({ where: eq(projectAssets.id, assetId) })
  if (!asset) return { user, asset: null, project: null }

  const project = await db.query.projects.findFirst({ where: eq(projects.id, asset.projectId) })
  if (!project || project.userId !== user.id) return { user, asset: null, project: null }

  return { user, asset, project }
}

export async function approveAsset(assetId: string) {
  const { user, asset, project } = await assertClientOwnsProject(assetId)
  if (!user || !asset || !project) {
    return { success: false, error: 'Not authorized.' }
  }

  try {
    await db
      .update(projectAssets)
      .set({ approvalStatus: 'approved', updatedAt: new Date() })
      .where(eq(projectAssets.id, assetId))

    await db.insert(projectActivity).values({
      projectId: project.id,
      actorUserId: user.id,
      actorType: 'client',
      action: 'asset_approved',
      summary: `${asset.title} was approved`,
      relatedAssetId: assetId,
    })

    revalidatePath(`/client/projects/${project.slug}`)
    revalidatePath(`/admin/projects/${project.id}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to approve asset:', error)
    return { success: false, error: 'Failed to approve asset.' }
  }
}

export async function requestAssetChanges(assetId: string, feedback: string) {
  const { user, asset, project } = await assertClientOwnsProject(assetId)
  if (!user || !asset || !project) {
    return { success: false, error: 'Not authorized.' }
  }
  if (!feedback.trim()) {
    return { success: false, error: 'Please describe what changes you would like.' }
  }

  try {
    await db
      .update(projectAssets)
      .set({ approvalStatus: 'changes_requested', updatedAt: new Date() })
      .where(eq(projectAssets.id, assetId))

    await db.insert(projectAssetComments).values({
      assetId,
      userId: user.id,
      senderType: 'client',
      body: feedback,
    })

    await db.insert(projectActivity).values({
      projectId: project.id,
      actorUserId: user.id,
      actorType: 'client',
      action: 'asset_changes_requested',
      summary: `Changes requested on ${asset.title}`,
      relatedAssetId: assetId,
    })

    revalidatePath(`/client/projects/${project.slug}`)
    revalidatePath(`/admin/projects/${project.id}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to request changes:', error)
    return { success: false, error: 'Failed to submit feedback.' }
  }
}

export async function addAssetComment(assetId: string, body: string, _senderType: 'client' | 'admin') {
  const authorization = await getCurrentUserWithRole()
  const user = authorization.user
  if (!authorization.authorized || !user) return { success: false, error: 'Not signed in.' }
  if (!body.trim()) return { success: false, error: 'Comment cannot be empty.' }

  try {
    const asset = await db.query.projectAssets.findFirst({ where: eq(projectAssets.id, assetId) })
    if (!asset) return { success: false, error: 'Asset not found.' }
    const project = await db.query.projects.findFirst({ where: eq(projects.id, asset.projectId) })
    if (_senderType !== 'client' && _senderType !== 'admin') return { success: false, error: 'Invalid sender type.' }
    const senderType = user.role === 'admin' ? 'admin' : 'client'
    if (!project || (senderType === 'client' && project.userId !== user.id)) return { success: false, error: 'Not authorized.' }

    const [comment] = await db
      .insert(projectAssetComments)
      .values({ assetId, userId: user.id, senderType, body })
      .returning()

    await db.insert(projectActivity).values({
      projectId: asset.projectId,
      actorUserId: user.id,
      actorType: senderType,
      action: 'comment_added',
      summary: `New comment on ${asset.title}`,
      relatedAssetId: assetId,
    })

    revalidatePath(`/admin/projects/${asset.projectId}`)
    revalidatePath(`/client/projects/${project.slug}`)
    return { success: true, comment }
  } catch (error) {
    console.error('Failed to add comment:', error)
    return { success: false, error: 'Failed to add comment.' }
  }
}

export async function addProjectNote(projectId: string, body: string) {
  const authorization = await getCurrentUserWithRole()
  const user = authorization.user
  const noteBody = body.trim().slice(0, 4000)
  if (!authorization.authorized || !user) return { success: false, error: 'Not signed in.' }
  if (!noteBody) return { success: false, error: 'Note cannot be empty.' }

  try {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { id: true, userId: true, slug: true } })
    if (!project) return { success: false, error: 'Project not found.' }
    const isStaff = STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])
    if (!isStaff && project.userId !== user.id) {
      const member = await db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)),
        columns: { id: true },
      })
      if (!member) return { success: false, error: 'Not authorized.' }
    }

    const authorType = isStaff ? 'admin' : 'client'
    const [note] = await db.insert(projectNotes).values({ projectId, userId: user.id, authorType, body: noteBody }).returning()
    await db.insert(projectActivity).values({
      projectId,
      actorUserId: user.id,
      actorType: authorType,
      action: 'note_added',
      summary: `${authorType === 'admin' ? 'Studio' : 'Client'} added a project note`,
    })
    revalidatePath(`/admin/client-projects/${projectId}`)
    if (project.slug) revalidatePath(`/client/projects/${project.slug}`)
    return { success: true, note: { ...note, createdAt: note.createdAt.toISOString() } }
  } catch (error) {
    console.error('Failed to add project note:', error)
    return { success: false, error: 'Failed to add project note.' }
  }
}

export async function getProjectNotes(projectId: string) {
  const authorization = await getCurrentUserWithRole()
  const user = authorization.user
  if (!authorization.authorized || !user) return { success: false, notes: [] }

  try {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { id: true, userId: true } })
    if (!project) return { success: false, notes: [] }
    const isStaff = STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])
    if (!isStaff && project.userId !== user.id) {
      const member = await db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)),
        columns: { id: true },
      })
      if (!member) return { success: false, notes: [] }
    }
    const notes = await db.select().from(projectNotes).where(eq(projectNotes.projectId, projectId)).orderBy(desc(projectNotes.createdAt)).limit(100)
    return { success: true, notes: notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() })) }
  } catch (error) {
    console.error('Failed to load project notes:', error)
    return { success: false, notes: [] }
  }
}

export async function getAssetComments(assetId: string) {
  const authorization = await getCurrentUserWithRole()
  const user = authorization.user
  if (!authorization.authorized || !user) return { success: false, comments: [] }
  try {
    const asset = await db.query.projectAssets.findFirst({ where: eq(projectAssets.id, assetId) })
    const project = asset ? await db.query.projects.findFirst({ where: eq(projects.id, asset.projectId) }) : null
    if (!asset || !project || (user.role !== 'admin' && project.userId !== user.id)) return { success: false, comments: [] }
    const comments = await db
      .select()
      .from(projectAssetComments)
      .where(eq(projectAssetComments.assetId, assetId))
      .orderBy(projectAssetComments.createdAt)

    return {
      success: true,
      comments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    }
  } catch (error) {
    console.error('Failed to load comments:', error)
    return { success: false, comments: [] }
  }
}
