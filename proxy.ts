import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Single request-authentication path for the app.
 *
 * - `/account` and `/admin` require a Clerk session. Unauthenticated visitors
 *   are redirected to the local `/sign-in` page (NEXT_PUBLIC_CLERK_SIGN_IN_URL)
 *   with `redirect_url` preserved by Clerk automatically.
 * - Role-based authorization (admin vs customer, etc.) is enforced
 *   server-side in layouts/pages via lib/auth — never in the client.
 * - Webhooks (`/api/webhooks`) stay public; Svix signature verification
 *   protects them in the route handler.
 */
const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ttf|woff2?|png|jpg|jpeg|gif|svg|svgz|ico|tif|tiff|webp|avif|mp4|webm|ogg|ogv|mov|mp3|wav|flac|aac|heic|heif|cur|ani|pdf|zip)|api|trpc).*)',
    '/(api|trpc)(.*)',
    '/_clerk(.*)',
  ],
}
