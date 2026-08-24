import 'server-only'

const DEFAULT_INGESTING_URL = 'https://in.logs.betterstack.com'
const REPORT_TIMEOUT_MS = 1_500

type ReportFields = Record<string, string | number | boolean | null | undefined>

function errorFields(error: unknown): ReportFields {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message, errorStack: error.stack }
  }
  return { errorMessage: String(error) }
}

/**
 * Best-effort structured error delivery. Logging must never make an already
 * failing page slower, so the network request is detached and time-bounded.
 */
export function reportServerError(message: string, error?: unknown, fields: ReportFields = {}) {
  const sourceToken = process.env.BETTERSTACK_SOURCE_TOKEN
  if (!sourceToken) return

  const ingestingUrl = process.env.BETTERSTACK_INGESTING_URL || DEFAULT_INGESTING_URL
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS)
  const event = {
    dt: new Date().toISOString(),
    level: 'error',
    message,
    service: 'the-revamp-ug',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    ...fields,
    ...(error === undefined ? {} : errorFields(error)),
  }

  void fetch(ingestingUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sourceToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
    signal: controller.signal,
    cache: 'no-store',
  })
    .catch((reportError) => {
      console.warn('[observability] Better Stack delivery skipped:', reportError)
    })
    .finally(() => clearTimeout(timeout))
}
