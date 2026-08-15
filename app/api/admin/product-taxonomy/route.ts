import { NextResponse } from "next/server"
import {
  db,
  departments,
  categories,
  subCategories,
  attributeTemplates,
} from "@/lib/db"
import { asc, eq } from "drizzle-orm"

export async function GET() {
  try {
    const [
      departmentRows,
      categoryRows,
      subCategoryRows,
    ] = await Promise.all([
      db
        .select({
          id: departments.id,
          name: departments.name,
          slug: departments.slug,
        })
        .from(departments)
        .where(eq(departments.active, true))
        .orderBy(asc(departments.order)),

      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          departmentId:
            categories.departmentId,
        })
        .from(categories)
        .where(eq(categories.active, true))
        .orderBy(asc(categories.order)),

      db
        .select({
          id: subCategories.id,
          name: subCategories.name,
          slug: subCategories.slug,
          categoryId:
            subCategories.categoryId,
          templateId:
            subCategories.templateId,
          googleProductCategoryId:
            subCategories.googleProductCategoryId,
          googleProductCategoryPath:
            subCategories.googleProductCategoryPath,
          templateSchema:
            attributeTemplates.schemaDefinition,
        })
        .from(subCategories)
        .leftJoin(
          attributeTemplates,
          eq(
            subCategories.templateId,
            attributeTemplates.id,
          ),
        )
        .where(eq(subCategories.active, true))
        .orderBy(asc(subCategories.order)),
    ])

    return NextResponse.json({
      success: true,
      departments: departmentRows,
      categories: categoryRows,
      subCategories:
        subCategoryRows,
    })
  } catch (error) {
    console.error(
      "Failed to load product taxonomy:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load product taxonomy.",
      },
      {
        status: 500,
      },
    )
  }
}