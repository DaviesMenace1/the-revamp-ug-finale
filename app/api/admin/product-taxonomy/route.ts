import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  departments,
  categories,
  subCategories,
  productAttributeTemplates,
} from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [departmentRows, categoryRows, subCategoryRows] =
      await Promise.all([
        db
          .select({
            id: departments.id,
            name: departments.name,
            slug: departments.slug,
          })
          .from(departments)
          .orderBy(asc(departments.name)),

        db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            departmentId: categories.departmentId,
          })
          .from(categories)
          .orderBy(asc(categories.name)),

        db
          .select({
            id: subCategories.id,
            name: subCategories.name,
            slug: subCategories.slug,
            categoryId: subCategories.categoryId,

            templateId: productAttributeTemplates.id,
            templateSchema: productAttributeTemplates.schema,

            googleProductCategoryId:
              subCategories.googleProductCategoryId,

            googleProductCategoryPath:
              subCategories.googleProductCategoryPath,
          })
          .from(subCategories)
          .leftJoin(
            productAttributeTemplates,
            eq(
              subCategories.attributeTemplateId,
              productAttributeTemplates.id,
            ),
          )
          .orderBy(asc(subCategories.name)),
      ])

    return NextResponse.json({
      departments: departmentRows,
      categories: categoryRows,
      subCategories: subCategoryRows,
    })
  } catch (error) {
    console.error("GET /api/admin/product-taxonomy:", error)

    return NextResponse.json(
      {
        error: "Failed to load product taxonomy.",
      },
      {
        status: 500,
      },
    )
  }
}
