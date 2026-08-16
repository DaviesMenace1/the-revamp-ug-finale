import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { desc, eq, and, inArray } from 'drizzle-orm'
import { POST as adminPOST } from '../admin/products/route'

export const dynamic = 'force-dynamic'

// Public GET: Retrieve all published items for storefront display
export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get('ids')
    const ids = idsParam
      ? idsParam.split(',').map((id) => id.trim()).filter(Boolean)
      : null

    const data = await db.query.products.findMany({
      where: ids
        ? and(eq(products.status, 'published'), inArray(products.id, ids))
        : eq(products.status, 'published'),
      orderBy: [desc(products.createdAt)],
      with: {
  productVariants: true,
  productImages: true,
},
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Direct proxy for POST & PUT to centralize write logic
export async function POST(req: NextRequest) {
  return adminPOST(req)
}

export async function PUT(req: NextRequest) {
  return adminPOST(req)
}




