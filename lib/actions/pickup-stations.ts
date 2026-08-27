'use server'

import { asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { pickupStations } from '@/lib/db/schema'
import { getCurrentUserWithRole } from '@/lib/auth/server'

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export type PickupStationRecord = {
  id: string
  name: string
  address: string
  city: string
  region: string | null
  country: string
  phone: string | null
  instructions: string | null
  fee: string
  latitude: string | null
  longitude: string | null
  active: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

function serialize(row: typeof pickupStations.$inferSelect): PickupStationRecord {
  return {
    ...row,
    fee: String(row.fee ?? '0'),
    latitude: row.latitude === null ? null : String(row.latitude),
    longitude: row.longitude === null ? null : String(row.longitude),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listPickupStations(includeInactive = false) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return []
  try {
    const rows = await db.select().from(pickupStations)
      .where(includeInactive ? undefined : eq(pickupStations.active, true))
      .orderBy(asc(pickupStations.displayOrder), asc(pickupStations.name))
      .limit(200)
    return rows.map(serialize)
  } catch (error) {
    console.error('[pickup-stations] failed to list:', error)
    return []
  }
}

export async function createPickupStation(input: {
  name: string
  address: string
  city: string
  region?: string
  country?: string
  phone?: string
  instructions?: string
  fee?: string
  latitude?: string
  longitude?: string
  displayOrder?: string
}) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'Only administrators can manage pickup stations.' }
  const name = text(input.name, 180)
  const address = text(input.address, 2000)
  const city = text(input.city, 120)
  const country = text(input.country, 100) || 'Uganda'
  const fee = number(input.fee, 0)
  if (!name || !address || !city) return { success: false, error: 'Name, address, and city are required.' }
  if (fee < 0) return { success: false, error: 'Pickup fee cannot be negative.' }
  try {
    await db.insert(pickupStations).values({
      name,
      address,
      city,
      region: text(input.region, 120) || null,
      country,
      phone: text(input.phone, 30) || null,
      instructions: text(input.instructions, 2000) || null,
      fee: fee.toFixed(2),
      latitude: text(input.latitude, 30) || null,
      longitude: text(input.longitude, 30) || null,
      displayOrder: Math.max(0, Math.floor(number(input.displayOrder, 0))),
      createdBy: authorization.user.id,
    })
    revalidatePath('/admin/settings')
    revalidatePath('/checkout')
    revalidatePath('/api/pickup-stations')
    return { success: true }
  } catch (error) {
    console.error('[pickup-stations] failed to create:', error)
    return { success: false, error: 'Could not add that pickup station.' }
  }
}

export async function updatePickupStation(input: {
  id: string
  name: string
  address: string
  city: string
  region?: string
  country?: string
  phone?: string
  instructions?: string
  fee?: string
  latitude?: string
  longitude?: string
  displayOrder?: string
  active?: boolean
}) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'Only administrators can manage pickup stations.' }
  const id = text(input.id, 80)
  const name = text(input.name, 180)
  const address = text(input.address, 2000)
  const city = text(input.city, 120)
  const country = text(input.country, 100) || 'Uganda'
  const fee = number(input.fee, 0)
  if (!id || !name || !address || !city) return { success: false, error: 'Name, address, and city are required.' }
  if (fee < 0) return { success: false, error: 'Pickup fee cannot be negative.' }
  try {
    const [updated] = await db.update(pickupStations).set({
      name,
      address,
      city,
      region: text(input.region, 120) || null,
      country,
      phone: text(input.phone, 30) || null,
      instructions: text(input.instructions, 2000) || null,
      fee: fee.toFixed(2),
      latitude: text(input.latitude, 30) || null,
      longitude: text(input.longitude, 30) || null,
      displayOrder: Math.max(0, Math.floor(number(input.displayOrder, 0))),
      active: typeof input.active === 'boolean' ? input.active : undefined,
      updatedAt: new Date(),
    }).where(eq(pickupStations.id, id)).returning({ id: pickupStations.id })
    if (!updated) return { success: false, error: 'Pickup station not found.' }
    revalidatePath('/admin/settings')
    revalidatePath('/checkout')
    revalidatePath('/api/pickup-stations')
    return { success: true }
  } catch (error) {
    console.error('[pickup-stations] failed to update:', error)
    return { success: false, error: 'Could not update that pickup station.' }
  }
}

export async function deletePickupStation(id: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'Only administrators can manage pickup stations.' }
  try {
    const [deleted] = await db.delete(pickupStations).where(eq(pickupStations.id, text(id, 80))).returning({ id: pickupStations.id })
    if (!deleted) return { success: false, error: 'Pickup station not found.' }
    revalidatePath('/admin/settings')
    revalidatePath('/checkout')
    revalidatePath('/api/pickup-stations')
    return { success: true }
  } catch (error) {
    console.error('[pickup-stations] failed to delete:', error)
    return { success: false, error: 'Could not remove that pickup station.' }
  }
}
