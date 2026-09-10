import { NextResponse } from 'next/server'
import { getPublishedSearchData } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getPublishedSearchData()
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (error) {
    console.error('Published search data error:', error)
    return NextResponse.json({ products: [], projects: [], articles: [], services: [], error: 'Search is temporarily unavailable.' }, { status: 500 })
  }
}
