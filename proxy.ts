import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that REQUIRE authentication
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ttf|woff2?|png|jpg|jpeg|gif|svg|svgz|ico|tif|tiff|webp|avif|mp4|webm|ogg|ogv|mov|mp3|wav|flac|aac|heic|heif|heic|cur|ani|pdf|zip)|api|trpc).*)"',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/_clerk(.*)',
  ],
}



// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/reset-password(.*)',
//   '/about(.*)',
//   '/services(.*)',
//   '/projects(.*)',
//   '/collections(.*)',
//   '/search(.*)',
//   '/cart(.*)',
//   '/wishlist(.*)',
//   '/journal(.*)',
//   '/contact(.*)',
//   '/api/webhooks(.*)',
//   '_/clerk(.*),
// ])

// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     const signInUrl = new URL('/sign-in', request.url)
//     signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname + request.nextUrl.search)
//     await auth.protect({ unauthenticatedUrl: signInUrl.toString() })
//   }
// })

// export const config = {
//   matcher: [
//     '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml)|_not-found).*)',
//     '/(api|trpc)(.*)',
//     '/__clerk/(.*)',
//   ],
// }
