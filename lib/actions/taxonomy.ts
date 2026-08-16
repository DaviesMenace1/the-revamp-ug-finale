'use server'

import { db } from '@/lib/db/client'
import { departments, categories, subCategories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// --- Departments ---

export async function createDepartment(name: string) {
  if (!name.trim()) return { success: false, error: 'Name is required.' }
  try {
    const [department] = await db
      .insert(departments)
      .values({ name, slug: slugify(name) })
      .returning()
    revalidatePath('/admin/categories')
    return { success: true, department }
  } catch (error) {
    console.error('Failed to create department:', error)
    return { success: false, error: 'Failed to create department.' }
  }
}

export async function updateDepartment(
  id: string,
  data: Partial<{ name: string; active: boolean; order: number }>,
) {
  try {
    await db.update(departments).set(data).where(eq(departments.id, id))
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Failed to update department:', error)
    return { success: false, error: 'Failed to update department.' }
  }
}

export async function deleteDepartment(id: string) {
  try {
    await db.delete(departments).where(eq(departments.id, id))
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete department:', error)
    return {
      success: false,
      error: 'Failed to delete department. Move or delete its categories first.',
    }
  }
}

// --- Categories ---

export async function createCategory(departmentId: string, name: string) {
  if (!name.trim()) return { success: false, error: 'Name is required.' }
  try {
    const [category] = await db
      .insert(categories)
      .values({ departmentId, name, slug: slugify(name) })
      .returning()
    revalidatePath('/admin/categories')
    return { success: true, category }
  } catch (error) {
    console.error('Failed to create category:', error)
    return { success: false, error: 'Failed to create category.' }
  }
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; active: boolean; order: number }>,
) {
  try {
    await db.update(categories).set(data).where(eq(categories.id, id))
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Failed to update category:', error)
    return { success: false, error: 'Failed to update category.' }
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id))
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete category:', error)
    return {
      success: false,
      error: 'Failed to delete category. Move or delete its subcategories first.',
    }
  }
}

// --- Sub-categories ---

export async function createSubCategory(
  categoryId: string,
  name: string,
  templateId: string,
) {
  if (!name.trim()) return { success: false, error: 'Name is required.' }
  if (!templateId) return { success: false, error: 'A template is required.' }
  try {
    const [subCategory] = await db
      .insert(subCategories)
      .values({ categoryId, name, slug: slugify(name), templateId })
      .returning()
    revalidatePath('/admin/categories')
    return { success: true, subCategory }
  } catch (error) {
    console.error('Failed to create subcategory:', error)
    return { success: false, error: 'Failed to create subcategory.' }
  }
}

export async function updateSubCategory(
  id: string,
  data: Partial<{
    name: string
    active: boolean
    order: number
    templateId: string
    googleProductCategoryPath: string
  }>,
) {
  try {
    await db.update(subCategories).set(data).where(eq(subCategories.id, id))
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Failed to update subcategory:', error)
    return { success: false, error: 'Failed to update subcategory.' }
  }
}

export async function deleteSubCategory(id: string) {
  try {
    await db.delete(subCategories).where(eq(subCategories.id, id))
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete subcategory:', error)
    return {
      success: false,
      error: 'Failed to delete subcategory. Products may still reference it.',
    }
  }
}
