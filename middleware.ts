import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define routes that should NOT require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/sign-in(.*)',
  '/about(.*)',
  '/services(.*)',
  '/projects(.*)',
  '/collections(.*)',
  '/journal(.*)',
  '/api/webhooks(.*)',
])

// Define subdomains or custom path rewrites if applicable
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.clone()

  // 1. Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // 2. Handle admin route rewriting (if needed)
  if (isAdminRoute(req)) {
    url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml)|_not-found).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}



{/*import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require login
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/sign-in(.*)',
  '/about(.*)',
  '/services(.*)',
  '/projects(.*)',
  '/collections(.*)',
  '/journal(.*)',
  '/api/webhooks(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml)|_not-found).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};


export default clerkMiddleware((auth, req: NextRequest) => {
  // Handle admin subdomain routing
  const host = req.headers.get('host') || ''
  const isAdminSubdomain = host.startsWith('admin.') || host.startsWith('administrator.')
  
  if (isAdminSubdomain) {
    // Rewrite admin subdomain to /admin path
    const url = req.nextUrl.clone()
    url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}*/}
