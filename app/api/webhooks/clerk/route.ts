import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { syncNewUserToBrevo } from '@/lib/db/brevo-sync'

type ClerkUserEvent = {
  data: {
    id: string
    email_addresses: { email_address: string; id: string }[]
    first_name: string | null
    last_name: string | null
    phone_numbers: { phone_number: string }[]
    image_url: string
    created_at: number
  }
  type: string
}

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!CLERK_WEBHOOK_SECRET) {
    return new Response('CLERK_WEBHOOK_SECRET not set', { status: 500 })
  }

  // Verify the webhook signature
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(CLERK_WEBHOOK_SECRET)
  let evt: ClerkUserEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkUserEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  const { type, data } = evt

  if (type === 'user.created') {
    const primaryEmail = data.email_addresses[0]?.email_address
    const phone = data.phone_numbers[0]?.phone_number

    if (!primaryEmail) {
      return new Response('No email address found', { status: 400 })
    }

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: data.id,
          email: primaryEmail,
          firstName: data.first_name ?? undefined,
          lastName: data.last_name ?? undefined,
          phone: phone ?? undefined,
          avatar: data.image_url ?? undefined,
        })
        .returning()

      // Sync to Brevo
      await syncNewUserToBrevo({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName ?? undefined,
        lastName: newUser.lastName ?? undefined,
        phone: newUser.phone ?? undefined,
      })
    } catch (err) {
      console.error('[v0] Clerk webhook user.created error:', err)
      return new Response('Error creating user', { status: 500 })
    }
  }

  if (type === 'user.updated') {
    const primaryEmail = data.email_addresses[0]?.email_address
    const phone = data.phone_numbers[0]?.phone_number

    try {
      await db
        .update(users)
        .set({
          email: primaryEmail,
          firstName: data.first_name ?? undefined,
          lastName: data.last_name ?? undefined,
          phone: phone ?? undefined,
          avatar: data.image_url ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, data.id))
    } catch (err) {
      console.error('[v0] Clerk webhook user.updated error:', err)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (type === 'user.deleted') {
    try {
      await db.delete(users).where(eq(users.clerkId, data.id))
    } catch (err) {
      console.error('[v0] Clerk webhook user.deleted error:', err)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('Webhook processed', { status: 200 })
}
