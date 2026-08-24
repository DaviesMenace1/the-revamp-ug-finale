import 'server-only'
import { reportServerError } from '@/lib/observability/betterstack'

export const PAGE_DATA_TIMEOUT_MS = 7_000

type SafeQueryResult<T> = {
  data: T
  error: string | null
}

/**
 * Resolve a server-side data operation without allowing a slow database or
 * storage dependency to hold a page request forever. The original promise is
 * deliberately not cancelled because database clients differ in cancellation
 * support; the database client still has its own statement/connect timeouts.
 */
export async function safeQuery<T>(
  query: PromiseLike<T>,
  label: string,
  fallback: T,
  timeoutMs = PAGE_DATA_TIMEOUT_MS,
): Promise<SafeQueryResult<T>> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined

  try {
    const data = await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} exceeded the ${timeoutMs}ms page-data timeout`))
        }, timeoutMs)
      }),
    ])

    return { data, error: null }
  } catch (error) {
    console.error(`[page-data] ${label} failed:`, error)
    reportServerError('Server page data loader failed', error, { loader: label })
    return { data: fallback, error: label }
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle)
  }
}
