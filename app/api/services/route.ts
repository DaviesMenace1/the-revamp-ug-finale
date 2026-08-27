import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { serviceCategories, services } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await db
      .select({
        categoryId: serviceCategories.id,
        categorySlug: serviceCategories.slug,
        categoryName: serviceCategories.name,
        serviceSlug: services.slug,
        serviceName: services.name,
        description: services.description,
        image: services.image,
      })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(services.status, 'published'), eq(serviceCategories.status, 'published')))
      .orderBy(asc(serviceCategories.order), asc(services.order))
      .limit(12)

    return NextResponse.json(
      { success: true, data: rows },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    )
  } catch (error) {
    console.error('[Services API] Error:', error)
    return NextResponse.json({ success: false, data: [] }, { status: 200 })
  }
}
