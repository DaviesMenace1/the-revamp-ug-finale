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
  // Skip Clerk protection if keys aren't configured (dev mode)
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next()
  }

  try {
    if (isProtectedRoute(req)) {
      await auth.protect()
    }
  } catch (error) {
    // Silently allow requests when Clerk isn't initialized
    return NextResponse.next()
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
