import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'


const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)','/checkout(.*)', '/api/admin(.*)'])

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
