import 'server-only' // Ensures this file can NEVER be accidentally imported in 'use client' components
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type UserRole = 'customer' | 'designer' | 'admin' | 'trade_member' | 'architect' | 'interior_designer'

export async function getCurrentUserWithRole(requiredRoles: UserRole[] = []) {
  const authSession = await auth()
    const userId = authSession.userId

      if (!userId) {
          return { user: null, authorized: false }
            }

              const user = await db
                  .select()
                      .from(users)
                          .where(eq(users.clerkId, userId))
                              .then(result => result[0])

                                if (!user) {
                                    return { user: null, authorized: false }
                                      }

                                        if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
                                            return { user, authorized: false }
                                              }

                                                return { user, authorized: true }
                                                }
                                                