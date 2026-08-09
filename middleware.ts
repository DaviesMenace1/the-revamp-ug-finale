import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define routes that should NOT require authentication
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
                          '/journal(.*)',
                            '/api/webhooks(.*)',
                            ])

                            const isAdminRoute = createRouteMatcher(['/admin(.*)'])

                            export default clerkMiddleware(async (auth, req) => {
                              const { userId } = await auth()
                                const url = req.nextUrl.clone()

                                  // 1. Protect non-public routes cleanly without throwing middleware exceptions
                                    if (!userId && !isPublicRoute(req)) {
                                        const signInUrl = new URL('/sign-in', req.url)
                                            signInUrl.searchParams.set('redirect_url', req.url)
                                                return NextResponse.redirect(signInUrl)
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
                                                                            '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml)|_not-found).*)',
                                                                                // Always run for API routes
                                                                                    '/(api|trpc)(.*)',
                                                                                      ],
                                                                                      }
