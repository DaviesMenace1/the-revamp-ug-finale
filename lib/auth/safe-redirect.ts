/**
 * Resolves a redirect target from an untrusted query param, guaranteeing the
 * result is always same-origin. Prevents open-redirect vulnerabilities in the
 * auth flow (sign-in, sign-up, OAuth callbacks) while preserving the path,
 * search params, and hash the caller asked for.
 */
export function safeRedirect(value: string | null, fallback = '/account') {
  if (!value) return fallback
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch {
    return fallback
  }
}
