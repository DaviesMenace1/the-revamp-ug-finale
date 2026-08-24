import 'server-only'

const DEFAULT_INGESTING_URL = 'https://in.logs.betterstack.com'
const REPORT_TIMEOUT_MS = 3_500

type ReportFields = Record<string, string | number | boolean | null | undefined>

function errorFields(error: unknown): ReportFields {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message, errorStack: error.stack }
  }
  return { errorMessage: String(error) }
}

function configuredIngestingUrl() {
  const candidate = process.env.BETTERSTACK_INGESTING_URL || DEFAULT_INGESTING_URL

  try {
    const url = new URL(candidate)
    const isLocalDevelopment = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname)
    if (url.protocol !== 'https:' && !isLocalDevelopment) throw new Error('Better Stack ingestion URL must use HTTPS.')
    if (!url.hostname) throw new Error('Better Stack ingestion URL must include a hostname.')
    return url.toString()
  } catch (error) {
    // A malformed optional observability setting must not break a page or
    // produce a warning on every request in production.
    if (process.env.NODE_ENV !== 'production') {
      console.error('[observability] Invalid Better Stack ingestion URL:', error)
    }
    return null
  }
}

/**
 * Best-effort structured error delivery. The request is detached and
 * time-bounded so telemetry can never hold up a page or action response.
 * AbortError is expected when the timeout fires and is intentionally silent.
 */
export function reportServerError(message: string, error?: unknown, fields: ReportFields = {}) {
  const sourceToken = process.env.BETTERSTACK_SOURCE_TOKEN
  const ingestingUrl = configuredIngestingUrl()
  if (!sourceToken || !ingestingUrl) return

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
    .catch(() => {
      // Observability is fail-open. Network failures, including our own
      // timeout AbortError, are dropped rather than recursively logged.
    })
    .finally(() => clearTimeout(timeout))
}
