import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'


const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
  '/client(.*)',
  '/checkout(.*)',
  '/api/admin(.*)',
  '/api/notifications(.*)',
  '/api/loyalty(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  const response = NextResponse.next()
  const referralCode = req.nextUrl.searchParams.get('ref')?.trim().toUpperCase()
  if (referralCode && /^[A-Z0-9-]{6,32}$/.test(referralCode)) {
    response.cookies.set('revamp_referral', referralCode, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
    })
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|ttf|woff2?|png|jpg|jpeg|gif|svg|svgz|ico|tif|tiff|webp|avif|mp4|webm|ogg|ogv|mov|mp3|wav|flac|aac|heic|heif|cur|ani|pdf|zip)|api|trpc).*)',
    '/(api|trpc)(.*)',
    '/_clerk(.*)',
  ],
}
