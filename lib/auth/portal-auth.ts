// lib/auth/portal-auth.ts
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export type UserRole =
  | 'customer'
    | 'designer'
      | 'admin'
        | 'trade_member'
          | 'architect'
            | 'interior_designer'

            /**
             * Validates auth and user role for Server Components, Layouts, and Actions.
              */
              export async function requirePortalUser(requiredRoles: UserRole[] = []) {
                const { userId: clerkId } = await auth()

                  if (!clerkId) {
                      redirect('/sign-in')
                        }

                          const user = await db
                              .select()
                                  .from(users)
                                      .where(eq(users.clerkId, clerkId))
                                          .then((result) => result[0])

                                            if (!user) {
                                                redirect('/sign-in')
                                                  }

                                                    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
                                                        redirect('/unauthorized')
                                                          }

                                                            return user
                                                            }
                                                            