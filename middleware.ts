import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Define protected routes — everything under /dashboard, /account, /admin
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/account(.*)',
  '/admin(.*)',
  '/orders(.*)',
  '/consultations(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle admin subdomain routing
  const host = req.headers.get('host') || ''
  const isAdminSubdomain = host.startsWith('administrator.') || host.includes('administrator')
  
  if (isAdminSubdomain) {
    // Rewrite admin subdomain to /admin path
    const url = req.nextUrl.clone()
    url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Skip Clerk protection if keys aren't configured (dev mode)
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next()
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
