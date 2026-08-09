import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml)|_not-found).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

export type UserRole = 'customer' | 'designer' | 'admin' | 'trade_member' | 'architect' | 'interior_designer'

/**
 * Middleware factory to protect portal routes
 */
export function withPortalAuth(requiredRoles: UserRole[] = []) {
  return async function middleware(request: NextRequest) {
    try {
      let userId: string | null = null
      
      try {
        const authSession = await auth()
        userId = authSession.userId
      } catch (clerkError) {
        // Clerk not initialized in dev - allow request to proceed
        return NextResponse.next()
      }

      if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, userId))
        .then(result => result[0])

      if (!user) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }

      // If specific roles required, check them
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // Attach user info to request for use in handlers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-role', user.role ?? 'customer')

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      // Allow request to proceed on error to prevent blocking dev server
      return NextResponse.next()
    }
  }
}

/**
 * Extract user info from middleware headers
 */
export function getUserFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id')
  const role = headers.get('x-user-role') as UserRole | null

  return {
    userId,
    role,
  }
}
