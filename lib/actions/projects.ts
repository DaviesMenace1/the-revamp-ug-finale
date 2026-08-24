'use server'

import { db } from '@/lib/db/client'
import { projects } from '@/lib/db/schema'
import { and, eq, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requirePortalUser } from '@/lib/auth/portal-auth'

const PROJECT_STATUSES = ['consultation_scheduled', 'design_phase', 'procurement_phase', 'installation_phase', 'completed', 'on_hold'] as const

type ProjectInput = Partial<typeof projects.$inferInsert> & {
  title?: unknown
  slug?: unknown
  tags?: unknown
  images?: unknown
  gallery?: unknown
  relatedProjects?: unknown
  budget?: unknown
  progress?: unknown
  dueDate?: unknown
  featured?: unknown
}

function textValue(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function slugValue(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255)
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 100)
}

function numericValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function dateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }
  return value === null || value === '' ? null : undefined
}

function normalizedProjectData(data: ProjectInput, includeDefaults = false) {
  const next: Record<string, unknown> = {}
  const title = textValue(data.title, 255)
  const slug = slugValue(data.slug || data.title)

  if (title !== undefined && title !== null) next.title = title
  if (slug) next.slug = slug
  if (data.description !== undefined) next.description = textValue(data.description, 10_000)
  if (data.longDescription !== undefined) next.longDescription = textValue(data.longDescription, 50_000)
  if (data.category !== undefined) next.category = textValue(data.category, 100)
  if (data.subCategory !== undefined) next.subCategory = textValue(data.subCategory, 100)
  if (data.clientName !== undefined) next.clientName = textValue(data.clientName, 255)
  if (data.client !== undefined) next.client = textValue(data.client, 255)
  if (data.shortDescription !== undefined) next.shortDescription = textValue(data.shortDescription, 2_000)
  if (data.location !== undefined) next.location = textValue(data.location, 255)
  if (data.designer !== undefined) next.designer = textValue(data.designer, 255)
  if (data.year !== undefined) next.year = textValue(data.year, 20)
  if (data.thumbnailImage !== undefined) next.thumbnailImage = textValue(data.thumbnailImage, 2_000)
  if (data.ogImage !== undefined) next.ogImage = textValue(data.ogImage, 2_000)
  if (data.budget !== undefined) next.budget = numericValue(data.budget)
  if (data.progress !== undefined) {
    const progress = numericValue(data.progress)
    if (progress !== undefined) next.progress = Math.max(0, Math.min(100, Math.round(progress)))
  }
  if (data.dueDate !== undefined) next.dueDate = dateValue(data.dueDate)
  if (data.images !== undefined) next.images = stringArray(data.images)
  if (data.gallery !== undefined) next.gallery = stringArray(data.gallery)
  if (data.tags !== undefined) next.tags = stringArray(data.tags)
  if (data.relatedProjects !== undefined) next.relatedProjects = stringArray(data.relatedProjects)
  if (data.featured !== undefined && typeof data.featured === 'boolean') next.featured = data.featured
  if (data.publishStatus !== undefined) next.publishStatus = textValue(data.publishStatus, 50)
  if (data.status !== undefined && typeof data.status === 'string' && PROJECT_STATUSES.includes(data.status as (typeof PROJECT_STATUSES)[number])) next.status = data.status
  if (data.projectKind !== undefined && (data.projectKind === 'portfolio' || data.projectKind === 'client')) next.projectKind = data.projectKind
  if (data.currentPhase !== undefined) next.currentPhase = textValue(data.currentPhase, 50)

  if (includeDefaults) {
    next.projectKind = next.projectKind || 'portfolio'
    next.publishStatus = next.publishStatus || 'published'
    next.status = next.status || 'consultation_scheduled'
    next.progress = next.progress ?? 0
  }

  return next
}

async function ensureUniqueSlug(slug: string, excludeId?: string) {
  const existing = await db.query.projects.findFirst({
    where: excludeId
      ? and(eq(projects.slug, slug), ne(projects.id, excludeId))
      : eq(projects.slug, slug),
    columns: { id: true },
  })
  if (!existing) return slug
  const suffix = `-${crypto.randomUUID().slice(0, 8)}`
  return `${slug.slice(0, 255 - suffix.length)}${suffix}`
}

export async function createProject(data: ProjectInput) {
  await requirePortalUser(['admin'], '/admin/projects')
  try {
    const normalized = normalizedProjectData(data, true)
    if (!normalized.title) return { success: false, error: 'A project title is required.' }
    normalized.slug = await ensureUniqueSlug(String(normalized.slug || normalized.title))
    const [created] = await db.insert(projects).values(normalized as typeof projects.$inferInsert).returning({ id: projects.id, slug: projects.slug })
    revalidatePath('/admin/projects')
    revalidatePath('/portfolio')
    return { success: true, project: created }
  } catch (error) {
    console.error('Failed to create project:', error)
    return { success: false, error: 'Failed to create project. Check the title, slug, and project fields, then try again.' }
  }
}

export async function updateProject(id: string, data: ProjectInput) {
  await requirePortalUser(['admin'], '/admin/projects')
  try {
    if (!id || typeof id !== 'string') return { success: false, error: 'A valid project is required.' }
    const normalized = normalizedProjectData(data)
    if (Object.keys(normalized).length === 0) return { success: false, error: 'No project changes were provided.' }
    if (normalized.title === null) return { success: false, error: 'A project title is required.' }
    if (normalized.slug) normalized.slug = await ensureUniqueSlug(String(normalized.slug), id)
    normalized.updatedAt = new Date()

    const [updated] = await db
      .update(projects)
      .set(normalized as Partial<typeof projects.$inferInsert>)
      .where(eq(projects.id, id))
      .returning({ id: projects.id, slug: projects.slug, title: projects.title })
    if (!updated) return { success: false, error: 'Project not found. Refresh the projects page and try again.' }

    revalidatePath('/admin/projects')
    revalidatePath('/portfolio')
    revalidatePath(`/portfolio/${updated.slug}`)
    return { success: true, project: updated }
  } catch (error) {
    console.error('Failed to update project:', error)
    return { success: false, error: 'Failed to update project. Check the title, slug, and project fields, then try again.' }
  }
}

export async function deleteProject(id: string) {
  await requirePortalUser(['admin'], '/admin/projects')
  try {
    if (!id || typeof id !== 'string') return { success: false, error: 'A valid project is required.' }
    const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id })
    if (!deleted) return { success: false, error: 'Project not found. Refresh the projects page and try again.' }
    revalidatePath('/admin/projects')
    revalidatePath('/portfolio')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete project:', error)
    return { success: false, error: 'Failed to delete project. Refresh the page and try again.' }
  }
}
