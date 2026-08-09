import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
  if (request.nextUrl.hostname === 'www.therevampug.com') {
    const url = request.nextUrl.clone()
    url.hostname = 'therevampug.com'
    return NextResponse.redirect(url, 308)
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml)|_not-found).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
