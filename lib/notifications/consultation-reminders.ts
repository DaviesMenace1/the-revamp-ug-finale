import 'server-only'

import { and, eq, gte, isNotNull, isNull, lt, or } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { consultationReminders, consultations } from '@/lib/db/schema'
import { notifyUser } from '@/lib/notifications/service'

const REMINDER_WINDOWS = [
  { key: '24h', minutesBefore: 24 * 60, label: 'tomorrow' },
  { key: '12h', minutesBefore: 12 * 60, label: 'in 12 hours' },
  { key: '1h', minutesBefore: 60, label: 'in 1 hour' },
  { key: '30m', minutesBefore: 30, label: 'in 30 minutes' },
] as const

const WINDOW_TOLERANCE_MS = 10 * 60 * 1000
const STALE_PROCESSING_MS = 30 * 60 * 1000
const MAX_ATTEMPTS = 3

type ReminderWindow = (typeof REMINDER_WINDOWS)[number]

type DueConsultation = {
  id: string
  userId: string
  title: string
  preferredDate: Date
  mode: string
  location: string | null
  meetingLink: string | null
}

function formatConsultationTime(date: Date) {
  return date.toLocaleString('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Kampala',
  })
}

function formatMeetingDetails(consultation: DueConsultation) {
  if (consultation.meetingLink) return 'Open your client portal to join the meeting.'
  if (consultation.location) return `Location: ${consultation.location}.`
  return 'Open your client portal for the meeting details.'
}

function buildReminderCopy(consultation: DueConsultation, reminder: ReminderWindow) {
  const mode = consultation.mode.replaceAll('_', ' ')
  const time = formatConsultationTime(consultation.preferredDate)
  return {
    title: reminder.key === '24h' ? 'Your consultation is tomorrow' : `Your consultation is ${reminder.label}`,
    message: `Your ${mode} consultation “${consultation.title}” is scheduled for ${time}. ${formatMeetingDetails(consultation)}`,
  }
}

async function getDueConsultations(reminder: ReminderWindow, now: Date) {
  const windowStart = new Date(now.getTime() + reminder.minutesBefore * 60 * 1000 - WINDOW_TOLERANCE_MS)
  const windowEnd = new Date(now.getTime() + reminder.minutesBefore * 60 * 1000 + WINDOW_TOLERANCE_MS)

  return db
    .select({
      id: consultations.id,
      userId: consultations.userId,
      title: consultations.title,
      preferredDate: consultations.preferredDate,
      mode: consultations.mode,
      location: consultations.location,
      meetingLink: consultations.meetingLink,
    })
    .from(consultations)
    .where(
      and(
        eq(consultations.status, 'scheduled'),
        isNotNull(consultations.confirmedAt),
        isNotNull(consultations.preferredDate),
        gte(consultations.preferredDate, windowStart),
        lt(consultations.preferredDate, windowEnd),
      ),
    )
    .limit(100) as Promise<DueConsultation[]>
}

async function claimReminder(consultation: DueConsultation, reminder: ReminderWindow, now: Date) {
  const scheduledFor = new Date(consultation.preferredDate.getTime() - reminder.minutesBefore * 60 * 1000)
  const [created] = await db
    .insert(consultationReminders)
    .values({
      consultationId: consultation.id,
      userId: consultation.userId,
      reminderKey: reminder.key,
      scheduledFor,
      status: 'processing',
      attempts: 1,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: [consultationReminders.consultationId, consultationReminders.reminderKey] })
    .returning({ id: consultationReminders.id })

  if (created) return created.id

  const [existing] = await db
    .select({
      id: consultationReminders.id,
      status: consultationReminders.status,
      attempts: consultationReminders.attempts,
      lastAttemptAt: consultationReminders.lastAttemptAt,
    })
    .from(consultationReminders)
    .where(and(eq(consultationReminders.consultationId, consultation.id), eq(consultationReminders.reminderKey, reminder.key)))
    .limit(1)

  if (!existing || existing.status === 'sent' || existing.attempts >= MAX_ATTEMPTS) return null

  const staleProcessing = existing.status === 'processing' && (!existing.lastAttemptAt || existing.lastAttemptAt.getTime() < now.getTime() - STALE_PROCESSING_MS)
  if (existing.status === 'processing' && !staleProcessing) return null

  const [claimed] = await db
    .update(consultationReminders)
    .set({
      status: 'processing',
      attempts: existing.attempts + 1,
      lastAttemptAt: now,
      lastError: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(consultationReminders.id, existing.id),
        or(
          eq(consultationReminders.status, 'pending'),
          eq(consultationReminders.status, 'failed'),
          and(
            eq(consultationReminders.status, 'processing'),
            or(isNull(consultationReminders.lastAttemptAt), lt(consultationReminders.lastAttemptAt, new Date(now.getTime() - STALE_PROCESSING_MS))),
          ),
        ),
      ),
    )
    .returning({ id: consultationReminders.id })

  return claimed?.id || null
}

async function processReminder(consultation: DueConsultation, reminder: ReminderWindow, now: Date) {
  const reminderId = await claimReminder(consultation, reminder, now)
  if (!reminderId) return 'skipped' as const

  const copy = buildReminderCopy(consultation, reminder)
  const result = await notifyUser({
    userId: consultation.userId,
    type: `consultation_reminder_${reminder.key}`,
    priority: 'important',
    title: copy.title,
    message: copy.message,
    actionUrl: '/client/consultations',
    metadata: {
      consultationId: consultation.id,
      reminderId,
      reminderKey: reminder.key,
      scheduledFor: consultation.preferredDate.toISOString(),
    },
    channels: ['in_app', 'push', 'email'],
  })

  if (result.success) {
    await db
      .update(consultationReminders)
      .set({ status: 'sent', sentAt: new Date(), updatedAt: new Date() })
      .where(eq(consultationReminders.id, reminderId))
    return 'sent' as const
  }

  await db
    .update(consultationReminders)
    .set({ status: 'failed', lastError: 'Notification creation failed.', updatedAt: new Date() })
    .where(eq(consultationReminders.id, reminderId))
  return 'failed' as const
}

export async function sendDueConsultationReminders(now = new Date()) {
  const summary = { scanned: 0, sent: 0, skipped: 0, failed: 0 }
  for (const reminder of REMINDER_WINDOWS) {
    const dueConsultations = await getDueConsultations(reminder, now)
    summary.scanned += dueConsultations.length
    for (const consultation of dueConsultations) {
      const status = await processReminder(consultation, reminder, now)
      if (status === 'sent') summary.sent += 1
      if (status === 'skipped') summary.skipped += 1
      if (status === 'failed') summary.failed += 1
    }
  }
  return summary
}

export const consultationReminderWindows = REMINDER_WINDOWS
