import { db } from '@/lib/db/client'
import { departments, categories, subCategories, attributeTemplates } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import CategoriesClient from './categories-client'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const allDepartments = await db.query.departments.findMany({ orderBy: asc(departments.order) })
  const allCategories = await db.query.categories.findMany({ orderBy: asc(categories.order) })
  const allSubCategories = await db.query.subCategories.findMany({ orderBy: asc(subCategories.order) })
  const allTemplates = await db.query.attributeTemplates.findMany({
    columns: { id: true, name: true },
    orderBy: asc(attributeTemplates.name),
  })

  return (
    <CategoriesClient
      initialDepartments={allDepartments}
      initialCategories={allCategories}
      initialSubCategories={allSubCategories}
      templates={allTemplates}
    />
  )
}
