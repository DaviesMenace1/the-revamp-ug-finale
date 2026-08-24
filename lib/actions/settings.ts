'use server'

import { db } from '@/lib/db/client'
import { siteSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'

export async function getSetting<T = Record<string, unknown>>(
  key: string,
  fallback: T,
): Promise<T> {
  try {
    const row = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    })
    return row ? ({ ...fallback, ...(row.value as object) } as T) : fallback
  } catch (error) {
    console.error(`Failed to load setting "${key}":`, error)
    return fallback
  }
}

export async function saveSetting(key: string, value: Record<string, unknown>) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) {
    return { success: false, error: 'You are not authorized to change settings.' }
  }
  try {
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error(`Failed to save setting "${key}":`, error)
    return { success: false, error: 'Failed to save settings.' }
  }
}
