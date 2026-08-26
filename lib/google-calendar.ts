import 'server-only'

import { JWT, OAuth2Client } from 'google-auth-library'
import { randomUUID } from 'node:crypto'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars'

function setting(name: string) {
  return process.env[name]?.trim() || ''
}

function privateKey() {
  return setting('GOOGLE_CALENDAR_PRIVATE_KEY').replace(/\\n/g, '\n')
}

function oauthConfigured() {
  return Boolean(setting('GOOGLE_CALENDAR_CLIENT_ID') && setting('GOOGLE_CALENDAR_CLIENT_SECRET') && setting('GOOGLE_CALENDAR_REFRESH_TOKEN'))
}

function serviceAccountConfigured() {
  return Boolean(setting('GOOGLE_CALENDAR_CLIENT_EMAIL') && privateKey())
}

function configured() {
  return Boolean(setting('GOOGLE_CALENDAR_ID') && (oauthConfigured() || serviceAccountConfigured()))
}

function createCalendarAuth() {
  if (oauthConfigured()) {
    const auth = new OAuth2Client(setting('GOOGLE_CALENDAR_CLIENT_ID'), setting('GOOGLE_CALENDAR_CLIENT_SECRET'))
    auth.setCredentials({ refresh_token: setting('GOOGLE_CALENDAR_REFRESH_TOKEN') })
    return auth
  }

  if (serviceAccountConfigured()) {
    return new JWT({
      email: setting('GOOGLE_CALENDAR_CLIENT_EMAIL'),
      key: privateKey(),
      scopes: [CALENDAR_SCOPE],
    })
  }

  throw new GoogleCalendarConfigError('Google Meet creation requires organizer OAuth variables (GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN) or an eligible service account, plus GOOGLE_CALENDAR_ID.')
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
    throw new GoogleCalendarConfigError('Google Meet creation requires organizer OAuth variables or an eligible service account, plus GOOGLE_CALENDAR_ID.')
  }

  const auth = createCalendarAuth()
  const tokenResponse = await auth.getAccessToken()
  const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token
  if (!accessToken) throw new GoogleCalendarApiError('Google Calendar authorization did not return an access token.')

  const end = new Date(input.start.getTime() + input.durationMinutes * 60_000)
  const timeZone = setting('GOOGLE_CALENDAR_TIME_ZONE') || 'Africa/Kampala'
  const attendeeEmails = [...new Set((input.attendeeEmails || []).map((email) => email.trim().toLowerCase()).filter(Boolean))]
  const response = await fetch(`${CALENDAR_API}/${encodeURIComponent(setting('GOOGLE_CALENDAR_ID'))}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
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
