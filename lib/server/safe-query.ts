import 'server-only'
import { reportServerError } from '@/lib/observability/betterstack'

export const PAGE_DATA_TIMEOUT_MS = 7_000

type SafeQueryResult<T> = {
  data: T
  error: string | null
}

/**
 * Resolve a server-side data operation without converting a slow request into
 * a false page failure. The database client owns cancellation through its
 * connect, statement, and lock timeouts. A Promise.race cannot cancel a
 * postgres.js query; returning before that query settles can leave the single
 * serverless connection occupied and make later requests appear to hang.
 *
 * The timeout argument remains source-compatible for existing callers, but is
 * intentionally not used as a second, non-cancellable timeout layer.
 */
export async function safeQuery<T>(
  query: PromiseLike<T>,
  label: string,
  fallback: T,
  timeoutMs = PAGE_DATA_TIMEOUT_MS,
): Promise<SafeQueryResult<T>> {
  void timeoutMs
  try {
    const data = await Promise.resolve(query)
    return { data, error: null }
  } catch (error) {
    console.error(`[page-data] ${label} failed:`, error)
    void reportServerError('Server page data loader failed', error, { loader: label })
    return { data: fallback, error: label }
  }
}
