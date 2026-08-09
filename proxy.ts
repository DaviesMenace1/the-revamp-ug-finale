import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about(.*)',
  '/services(.*)',
  '/projects(.*)',
  '/collections(.*)',
  '/search(.*)',
  '/cart(.*)',
  '/wishlist(.*)',
  '/checkout(.*)',
  '/journal(.*)',
  '/contact(.*)',
  '/api/webhooks(.*)',
  '/__clerk(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname + request.nextUrl.search)
    await auth.protect({ unauthenticatedUrl: signInUrl.toString() })
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml)|_not-found).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
