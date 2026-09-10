import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { pickupStations } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stations = await db.select({
      id: pickupStations.id,
      name: pickupStations.name,
      address: pickupStations.address,
      city: pickupStations.city,
      region: pickupStations.region,
      country: pickupStations.country,
      phone: pickupStations.phone,
      instructions: pickupStations.instructions,
      fee: pickupStations.fee,
      latitude: pickupStations.latitude,
      longitude: pickupStations.longitude,
    }).from(pickupStations)
      .where(eq(pickupStations.active, true))
      .orderBy(asc(pickupStations.displayOrder), asc(pickupStations.name))
      .limit(100)

    return NextResponse.json({ stations }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  } catch (error) {
    console.error('GET /api/pickup-stations error:', error)
    return NextResponse.json({ error: 'We could not load pickup stations.' }, { status: 500 })
  }
}
