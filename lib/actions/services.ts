'use server'

import { db } from '@/lib/db/client'
import { services, serviceCategories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'

async function isAdmin() {
  return (await getCurrentUserWithRole(['admin', 'editor'])).authorized
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// --- Categories ---

export async function createServiceCategory(data: {
  name: string
  description?: string
  icon?: string
  image?: string
}) {
  if (!(await isAdmin())) return { success: false, error: 'You are not authorized to manage services.' }
  try {
    const [category] = await db
      .insert(serviceCategories)
      .values({
        name: data.name,
        slug: slugify(data.name),
        description: data.description || null,
        icon: data.icon || null,
        image: data.image || null,
      })
      .returning()

    revalidatePath('/admin/services')
    return { success: true, category }
  } catch (error) {
    console.error('Failed to create service category:', error)
    return { success: false, error: 'Failed to create category.' }
  }
}

export async function updateServiceCategory(
  id: string,
  data: Partial<{
    name: string
    description: string
    icon: string
    image: string
    status: string
    featured: boolean
  }>,
) {
  if (!(await isAdmin())) return { success: false, error: 'You are not authorized to manage services.' }
  try {
    await db
      .update(serviceCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceCategories.id, id))

    revalidatePath('/admin/services')
    return { success: true }
  } catch (error) {
    console.error('Failed to update service category:', error)
    return { success: false, error: 'Failed to update category.' }
  }
}

export async function deleteServiceCategory(id: string) {
  if (!(await isAdmin())) return { success: false, error: 'You are not authorized to manage services.' }
  try {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id))
    revalidatePath('/admin/services')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete service category:', error)
    return {
      success: false,
      error: 'Failed to delete category. Move or delete its services first.',
    }
  }
}

// --- Services ---

export async function createService(data: {
  categoryId: string
  name: string
  description?: string
  longDescription?: string
  icon?: string
  image?: string
  gallery?: string[]
}) {
  if (!(await isAdmin())) return { success: false, error: 'You are not authorized to manage services.' }
  try {
    const [service] = await db
      .insert(services)
      .values({
        categoryId: data.categoryId,
        name: data.name,
        slug: slugify(data.name),
        description: data.description || null,
        longDescription: data.longDescription || null,
        icon: data.icon || null,
        image: data.image || null,
        gallery: data.gallery || [],
      })
      .returning()

    revalidatePath('/admin/services')
    return { success: true, service }
  } catch (error) {
    console.error('Failed to create service:', error)
    return { success: false, error: 'Failed to create service.' }
  }
}

export async function updateService(
  id: string,
  data: Partial<{
    categoryId: string
    name: string
    description: string
    longDescription: string
    icon: string
    image: string
    gallery: string[]
    status: string
    featured: boolean
  }>,
) {
  if (!(await isAdmin())) return { success: false, error: 'You are not authorized to manage services.' }
  try {
    await db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))

    revalidatePath('/admin/services')
    return { success: true }
  } catch (error) {
    console.error('Failed to update service:', error)
    return { success: false, error: 'Failed to update service.' }
  }
}

export async function deleteService(id: string) {
  if (!(await isAdmin())) return { success: false, error: 'You are not authorized to manage services.' }
  try {
    await db.delete(services).where(eq(services.id, id))
    revalidatePath('/admin/services')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete service:', error)
    return { success: false, error: 'Failed to delete service.' }
  }
}
