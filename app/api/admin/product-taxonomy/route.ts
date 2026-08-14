import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  departments,
  categories,
  subCategories,
  attributeTemplates,
} from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Returns the complete product taxonomy used by the admin product creator.
 *
 * Structure:
 *
 * Department
 *   └── Category
 *         └── Subcategory
 *                └── Attribute Template
 *
 * IMPORTANT:
 * The frontend must NOT maintain its own hardcoded product taxonomy.
 * Supabase is the source of truth.
 */
export async function GET() {
  try {
    const rows = await db
      .select({
        departmentId: departments.id,
        departmentName: departments.name,
        departmentSlug: departments.slug,

        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,

        subCategoryId: subCategories.id,
        subCategoryName: subCategories.name,
        subCategorySlug: subCategories.slug,

        templateId: attributeTemplates.id,
        templateName: attributeTemplates.name,
        templateVersion: attributeTemplates.version,
        templateSchema: attributeTemplates.schemaDefinition,

        googleProductCategoryId: subCategories.googleProductCategoryId,
      })
      .from(subCategories)
      .innerJoin(
        categories,
        eq(subCategories.categoryId, categories.id)
      )
      .innerJoin(
        departments,
        eq(categories.departmentId, departments.id)
      )
      .innerJoin(
        attributeTemplates,
        eq(subCategories.templateId, attributeTemplates.id)
      )
      .where(
        eq(subCategories.active, true)
      )
      .orderBy(
        asc(departments.order),
        asc(categories.order),
        asc(subCategories.order)
      )

    const taxonomy = new Map<string, any>()

    for (const row of rows) {
      if (!taxonomy.has(row.departmentId)) {
        taxonomy.set(row.departmentId, {
          id: row.departmentId,
          name: row.departmentName,
          slug: row.departmentSlug,
          categories: [],
        })
      }

      const department = taxonomy.get(row.departmentId)

      let category = department.categories.find(
        (item: any) => item.id === row.categoryId
      )

      if (!category) {
        category = {
          id: row.categoryId,
          name: row.categoryName,
          slug: row.categorySlug,
          subCategories: [],
        }

        department.categories.push(category)
      }

      category.subCategories.push({
        id: row.subCategoryId,
        name: row.subCategoryName,
        slug: row.subCategorySlug,

        googleProductCategoryId:
          row.googleProductCategoryId ?? null,

        template: {
          id: row.templateId,
          name: row.templateName,
          version: row.templateVersion,
          schemaDefinition: row.templateSchema,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: Array.from(taxonomy.values()),
    })
  } catch (error) {
    console.error('Product taxonomy error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load product taxonomy',
      },
      { status: 500 }
    )
  }
}
