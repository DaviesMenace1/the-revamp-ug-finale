/**
 * POST /api/newsletter/subscribe
 * Subscribes email to Supabase AND syncs with Brevo CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db'; // Make sure this path points to your Drizzle instance
import { subscribers } from '@/drizzle/schema'; // Make sure 'subscribers' table exists in schema.ts
import { subscribeToNewsletter } from '@/lib/brevo/sync';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName } = body;

    // 1. Validate email format
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Save / Check in Supabase Database via Drizzle
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, cleanEmail))
      .limit(1);

    if (existingSubscriber.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'You are already subscribed to our newsletter!',
          email: cleanEmail,
        },
        { status: 200 }
      );
    }

    // Insert new subscriber into Supabase
    await db.insert(subscribers).values({
      email: cleanEmail,
      firstName: firstName || null,
      lastName: lastName || null,
      subscribedAt: new Date(),
    });

    // 3. Sync to Brevo CRM (wrap in try-catch so DB save still succeeds even if Brevo fails)
    try {
      await subscribeToNewsletter(cleanEmail, firstName, lastName);
    } catch (brevoError) {
      console.warn('[Newsletter] Saved to DB, but Brevo sync failed:', brevoError);
      // We don't fail the request here because the lead IS saved in Supabase!
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter',
        email: cleanEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Newsletter] Subscription error:', error);

    return NextResponse.json(
      {
        error: 'Failed to subscribe to newsletter',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/newsletter/subscribe
 * CORS support
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
