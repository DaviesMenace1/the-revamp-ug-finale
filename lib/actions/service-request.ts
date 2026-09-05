'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { serviceRequests, users, services } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { notifyUser } from '@/lib/notifications/service'
import { getCurrentUserWithRole } from '@/lib/auth/server'

export type ServiceRequestInput = {
  name: string
  email: string
  phone?: string
  company?: string
  serviceType: string
  budget?: string
  timeline?: string
  projectDescription: string
  serviceId?: string
}

function clean(value: string | undefined, maxLength: number) {
  return (value || '').trim().slice(0, maxLength)
}

const SERVICE_REQUEST_STATUSES = ['pending', 'contacted', 'qualified', 'closed'] as const

export async function submitServiceRequest(input: ServiceRequestInput) {
  const name = clean(input.name, 255)
  const email = clean(input.email, 255).toLowerCase()
  const serviceType = clean(input.serviceType, 100)
  const projectDescription = clean(input.projectDescription, 5000)
  if (name.length < 2) return { success: false, error: 'Please enter your name.' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { success: false, error: 'Please enter a valid email address.' }
  if (!serviceType) return { success: false, error: 'Choose what you would like help with.' }
  if (projectDescription.length < 10) return { success: false, error: 'Please give us a little more context about your project.' }

  try {
    const { userId: clerkId } = await auth()
    const localUser = clerkId ? await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1) : []
    const serviceId = input.serviceId && /^[0-9a-f-]{36}$/i.test(input.serviceId)
      ? (await db.select({ id: services.id }).from(services).where(eq(services.id, input.serviceId)).limit(1))[0]?.id || null
      : null
    const [request] = await db.insert(serviceRequests).values({
      userId: localUser[0]?.id || null,
      serviceId,
      name,
      email,
      phone: clean(input.phone, 20) || null,
      company: clean(input.company, 255) || null,
      serviceType,
      budget: clean(input.budget, 100) || null,
      timeline: clean(input.timeline, 100) || null,
      projectDescription,
      status: 'pending',
    }).returning({ id: serviceRequests.id })

    try {
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(20)
      await Promise.all(admins.map((admin) => notifyUser({
        userId: admin.id,
        type: 'service_request',
        priority: 'important',
        title: 'New studio inquiry',
        message: `${name} requested help with ${serviceType.replaceAll('_', ' ')}.`,
        actionUrl: '/admin/service-requests',
        metadata: { requestId: request.id, email },
        channels: ['in_app'],
      })))
    } catch (notificationError) {
      console.error('[service-request] admin notification follow-up failed:', notificationError)
    }

    revalidatePath('/admin/service-requests')
    return { success: true, requestId: request.id }
  } catch (error) {
    console.error('[service-request] failed to save inquiry:', error)
    return { success: false, error: 'We could not send your inquiry. Please try again or contact the studio directly.' }
  }
}

export async function updateServiceRequestStatus(id: string, status: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'Only administrators can update service requests.' }
  if (!SERVICE_REQUEST_STATUSES.includes(status as typeof SERVICE_REQUEST_STATUSES[number])) return { success: false, error: 'Invalid service-request status.' }

  try {
    await db.update(serviceRequests).set({ status, updatedAt: new Date() }).where(eq(serviceRequests.id, id))
    revalidatePath('/admin/service-requests')
    return { success: true }
  } catch (error) {
    console.error('[service-request] failed to update status:', error)
    return { success: false, error: 'Unable to update this request.' }
  }
}

export async function updateServiceRequestNotes(id: string, notes: string) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized) return { success: false, error: 'Only administrators can update service requests.' }

  try {
    await db.update(serviceRequests).set({ notes: clean(notes, 5000) || null, updatedAt: new Date() }).where(eq(serviceRequests.id, id))
    revalidatePath('/admin/service-requests')
    return { success: true }
  } catch (error) {
    console.error('[service-request] failed to update notes:', error)
    return { success: false, error: 'Unable to save these notes.' }
  }
}
