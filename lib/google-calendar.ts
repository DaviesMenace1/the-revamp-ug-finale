import 'server-only'

import { JWT } from 'google-auth-library'
import { randomUUID } from 'node:crypto'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars'

function setting(name: string) {
  return process.env[name]?.trim() || ''
}

function privateKey() {
  return setting('GOOGLE_CALENDAR_PRIVATE_KEY').replace(/\\n/g, '\n')
}

function configured() {
  return Boolean(setting('GOOGLE_CALENDAR_CLIENT_EMAIL') && privateKey() && setting('GOOGLE_CALENDAR_ID'))
}

export function googleCalendarConfigured() {
  return configured()
}

export class GoogleCalendarConfigError extends Error {
  constructor(message = 'Google Calendar is not configured.') {
    super(message)
    this.name = 'GoogleCalendarConfigError'
  }
}

export class GoogleCalendarApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleCalendarApiError'
  }
}

export async function createGoogleMeetEvent(input: {
  summary: string
  description?: string | null
  start: Date
  durationMinutes: number
  location?: string | null
  attendeeEmails?: string[]
}) {
  if (!configured()) {
    throw new GoogleCalendarConfigError('Google Meet creation requires GOOGLE_CALENDAR_CLIENT_EMAIL, GOOGLE_CALENDAR_PRIVATE_KEY, and GOOGLE_CALENDAR_ID.')
  }

  const auth = new JWT({
    email: setting('GOOGLE_CALENDAR_CLIENT_EMAIL'),
    key: privateKey(),
    scopes: [CALENDAR_SCOPE],
  })
  const token = await auth.getAccessToken()
  if (!token.token) throw new GoogleCalendarApiError('Google Calendar authorization did not return an access token.')

  const end = new Date(input.start.getTime() + input.durationMinutes * 60_000)
  const timeZone = setting('GOOGLE_CALENDAR_TIME_ZONE') || 'Africa/Kampala'
  const attendeeEmails = [...new Set((input.attendeeEmails || []).map((email) => email.trim().toLowerCase()).filter(Boolean))]
  const response = await fetch(`${CALENDAR_API}/${encodeURIComponent(setting('GOOGLE_CALENDAR_ID'))}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: input.summary.slice(0, 255),
      description: input.description?.slice(0, 8000) || undefined,
      location: input.location?.slice(0, 500) || undefined,
      start: { dateTime: input.start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
      attendees: attendeeEmails.map((email) => ({ email })),
      reminders: { useDefault: true },
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    }),
  })
  const payload = await response.json().catch(() => ({})) as {
    id?: string
    htmlLink?: string
    hangoutLink?: string
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] }
    error?: { message?: string }
  }
  if (!response.ok) throw new GoogleCalendarApiError(payload.error?.message || `Google Calendar returned HTTP ${response.status}.`)

  const meetUrl = payload.hangoutLink || payload.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri
  if (!payload.id || !meetUrl) throw new GoogleCalendarApiError('Google Calendar created an event but did not return a Meet link. Check that Meet conferencing is enabled for the organizer calendar.')

  return { calendarEventId: payload.id, calendarUrl: payload.htmlLink || null, meetUrl, timeZone }
}
