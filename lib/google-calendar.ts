import 'server-only'

import { JWT, OAuth2Client } from 'google-auth-library'
import { randomUUID } from 'node:crypto'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars'
const MEET_API = 'https://meet.googleapis.com/v2/spaces'

function setting(name: string) {
  return process.env[name]?.trim() || ''
}

function privateKey() {
  return setting('GOOGLE_CALENDAR_PRIVATE_KEY').replace(/\\n/g, '\n')
}

function calendarOAuthConfigured() {
  return Boolean(
    setting('GOOGLE_CALENDAR_CLIENT_ID') &&
      setting('GOOGLE_CALENDAR_CLIENT_SECRET') &&
      setting('GOOGLE_CALENDAR_REFRESH_TOKEN'),
  )
}

function meetOAuthConfigured() {
  return Boolean(
    setting('GOOGLE_CALENDAR_CLIENT_ID') &&
      setting('GOOGLE_CALENDAR_CLIENT_SECRET') &&
      setting('GOOGLE_MEET_REFRESH_TOKEN'),
  )
}

function serviceAccountConfigured() {
  return Boolean(setting('GOOGLE_CALENDAR_CLIENT_EMAIL') && privateKey())
}

function calendarImpersonateEmail() {
  return setting('GOOGLE_CALENDAR_IMPERSONATE_EMAIL')
}

function createServiceAccountAuth() {
  return new JWT({
    email: setting('GOOGLE_CALENDAR_CLIENT_EMAIL'),
    key: privateKey(),
    scopes: [CALENDAR_SCOPE],
    subject: calendarImpersonateEmail() || undefined,
  })
}

function calendarConfigured() {
  return Boolean(setting('GOOGLE_CALENDAR_ID') && (calendarOAuthConfigured() || serviceAccountConfigured()))
}

function createOAuthAuth(refreshToken: string) {
  const auth = new OAuth2Client(setting('GOOGLE_CALENDAR_CLIENT_ID'), setting('GOOGLE_CALENDAR_CLIENT_SECRET'))
  auth.setCredentials({ refresh_token: refreshToken })
  return auth
}

function createCalendarAuth() {
  if (calendarOAuthConfigured()) return createOAuthAuth(setting('GOOGLE_CALENDAR_REFRESH_TOKEN'))

  if (serviceAccountConfigured()) return createServiceAccountAuth()

  throw new GoogleCalendarConfigError(
    'Google Calendar needs GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN, and GOOGLE_CALENDAR_ID, or a service account with domain-wide delegation and GOOGLE_CALENDAR_IMPERSONATE_EMAIL.',
  )
}

function createMeetAuth() {
  if (!meetOAuthConfigured()) {
    throw new GoogleCalendarConfigError(
      'Google Meet fallback needs GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_MEET_REFRESH_TOKEN issued with the meetings.space.created scope.',
    )
  }
  return createOAuthAuth(setting('GOOGLE_MEET_REFRESH_TOKEN'))
}

function isInvalidGrantError(error: unknown) {
  const candidate = error as { response?: { data?: { error?: string; error_description?: string } }; message?: string }
  const value = [candidate?.response?.data?.error, candidate?.response?.data?.error_description, candidate?.message].filter(Boolean).join(' ')
  return /invalid_grant|expired or revoked/i.test(value)
}

async function accessToken(auth: OAuth2Client | JWT) {
  try {
    const tokenResponse = await auth.getAccessToken()
    const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token
    if (!token) throw new GoogleCalendarApiError('Google authorization did not return an access token.')
    return token
  } catch (error) {
    if (isInvalidGrantError(error)) {
      if (auth instanceof OAuth2Client) {
        throw new GoogleCalendarConfigError('The Google OAuth refresh token is expired or revoked. Re-authorize the organizer account and replace GOOGLE_CALENDAR_REFRESH_TOKEN, or use a valid service-account organizer with domain-wide delegation.')
      }
      throw new GoogleCalendarConfigError('The Google service-account organizer could not be authorized. Check GOOGLE_CALENDAR_CLIENT_EMAIL, GOOGLE_CALENDAR_PRIVATE_KEY, and GOOGLE_CALENDAR_IMPERSONATE_EMAIL, then confirm Calendar API access is delegated to that Workspace user.')
    }
    throw error
  }
}

export function googleCalendarConfigured() {
  return calendarConfigured() || meetOAuthConfigured()
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

function isInvalidConferenceTypeError(error: unknown) {
  return error instanceof GoogleCalendarApiError && /invalid conference type|conference type value/i.test(error.message)
}

async function createCalendarEvent(input: {
  summary: string
  description?: string | null
  start: Date
  durationMinutes: number
  location?: string | null
  attendeeEmails?: string[]
}, auth: OAuth2Client | JWT = createCalendarAuth()) {
  const token = await accessToken(auth)
  const end = new Date(input.start.getTime() + input.durationMinutes * 60_000)
  const timeZone = setting('GOOGLE_CALENDAR_TIME_ZONE') || 'Africa/Kampala'
  const attendeeEmails = [...new Set((input.attendeeEmails || []).map((email) => email.trim().toLowerCase()).filter(Boolean))]
  const response = await fetch(`${CALENDAR_API}/${encodeURIComponent(setting('GOOGLE_CALENDAR_ID'))}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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

async function createMeetSpace() {
  const auth = createMeetAuth()
  const token = await accessToken(auth)
  const response = await fetch(MEET_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  const payload = await response.json().catch(() => ({})) as {
    name?: string
    meetingUri?: string
    error?: { message?: string }
  }
  if (!response.ok) throw new GoogleCalendarApiError(payload.error?.message || `Google Meet returned HTTP ${response.status}.`)
  if (!payload.meetingUri) throw new GoogleCalendarApiError('Google Meet created a space but did not return a meeting link.')
  return {
    calendarEventId: null,
    calendarUrl: null,
    meetUrl: payload.meetingUri,
    timeZone: setting('GOOGLE_CALENDAR_TIME_ZONE') || 'Africa/Kampala',
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
  if (calendarConfigured()) {
    try {
      return await createCalendarEvent(input)
    } catch (error) {
      if (isInvalidGrantError(error) && serviceAccountConfigured() && calendarImpersonateEmail()) {
        console.warn('[google-meet] Calendar OAuth could not refresh; using the delegated service-account organizer.')
        return createCalendarEvent(input, createServiceAccountAuth())
      }
      if (isInvalidGrantError(error) && meetOAuthConfigured()) {
        console.warn('[google-meet] Calendar OAuth could not refresh; using the direct Meet Spaces fallback.')
        return createMeetSpace()
      }
      if (isInvalidConferenceTypeError(error)) {
        if (meetOAuthConfigured()) {
          console.warn('[google-meet] Calendar conference creation rejected the conference type; using the Meet Spaces fallback.')
          return createMeetSpace()
        }
        if (serviceAccountConfigured() && !calendarImpersonateEmail()) {
          throw new GoogleCalendarConfigError('Google Calendar rejected Meet creation for this service account. Add GOOGLE_CALENDAR_IMPERSONATE_EMAIL for a Workspace user with domain-wide delegation, or configure GOOGLE_MEET_REFRESH_TOKEN with the meetings.space.created scope.')
        }
      }
      throw error
    }
  }

  if (meetOAuthConfigured()) return createMeetSpace()

  throw new GoogleCalendarConfigError(
    'Virtual slot creation needs a Google Calendar organizer setup, or GOOGLE_MEET_REFRESH_TOKEN issued with the meetings.space.created scope for the direct Meet fallback. Service-account organizers also need GOOGLE_CALENDAR_IMPERSONATE_EMAIL.',
  )
}
