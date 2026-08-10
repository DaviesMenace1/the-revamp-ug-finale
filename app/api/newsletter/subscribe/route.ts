import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { subscribeToNewsletter } from '@/lib/brevo/sync'; // Your sync service
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
      const { email, firstName, lastName } = await req.json();

          if (!email || typeof email !== 'string') {
                return NextResponse.json(
                        { error: 'A valid email address is required.' },
                                { status: 400 }
                                      );
                                          }

                                              // 1. Check if already subscribed in the database
                                                  const existing = await db
                                                        .select()
                                                              .from(subscribers)
                                                                    .where(eq(subscribers.email, email))
                                                                          .limit(1);

                                                                              if (existing.length > 0) {
                                                                                    return NextResponse.json(
                                                                                            { message: 'You are already subscribed!' },
                                                                                                    { status: 200 }
                                                                                                          );
                                                                                                              }

                                                                                                                  // 2. Sync subscriber with Brevo using your existing helper
                                                                                                                      try {
                                                                                                                            await subscribeToNewsletter(email, firstName, lastName);
                                                                                                                                } catch (brevoError) {
                                                                                                                                      console.warn('[Brevo] Sync failed, proceeding with DB insert:', brevoError);
                                                                                                                                          }

                                                                                                                                              // 3. Insert record into PostgreSQL subscribers table
                                                                                                                                                  await db.insert(subscribers).values({
                                                                                                                                                        email,
                                                                                                                                                            });

                                                                                                                                                                return NextResponse.json(
                                                                                                                                                                      { message: 'Successfully subscribed to the newsletter!' },
                                                                                                                                                                            { status: 201 }
                                                                                                                                                                                );
                                                                                                                                                                                  } catch (error) {
                                                                                                                                                                                      console.error('Newsletter subscription error:', error);
                                                                                                                                                                                          return NextResponse.json(
                                                                                                                                                                                                { error: 'An unexpected error occurred. Please try again later.' },
                                                                                                                                                                                                      { status: 500 }
                                                                                                                                                                                                          );
                                                                                                                                                                                                            }
                                                                                                                                                                                                            }
                                                                                                                                                                                                            