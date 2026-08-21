'use server'

import { db } from '@/lib/db/client'
import { projectAssets, projectAssetComments, projectActivity, projects } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'

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

export async function addAssetComment(assetId: string, body: string, senderType: 'client' | 'admin') {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }
  if (!body.trim()) return { success: false, error: 'Comment cannot be empty.' }

  try {
    const asset = await db.query.projectAssets.findFirst({ where: eq(projectAssets.id, assetId) })
    if (!asset) return { success: false, error: 'Asset not found.' }

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
    return { success: true, comment }
  } catch (error) {
    console.error('Failed to add comment:', error)
    return { success: false, error: 'Failed to add comment.' }
  }
}

export async function getAssetComments(assetId: string) {
  try {
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
