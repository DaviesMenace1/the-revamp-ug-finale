import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { sendNewsletterWelcomeEmail, subscribeToNewsletter } from '@/lib/brevo/sync';
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

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if already subscribed in the database
    const existing = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'You are already subscribed!' },
        { status: 200 }
      );
    }

    // 2. Sync subscriber with Brevo
    try {
      await subscribeToNewsletter(normalizedEmail, firstName, lastName);
    } catch (brevoError) {
      console.warn('[Brevo] Sync failed, proceeding with DB insert:', brevoError);
    }

    // 3. Insert record into PostgreSQL subscribers table
    await db.insert(subscribers).values({
      email: normalizedEmail,
    });

    try {
      await sendNewsletterWelcomeEmail(normalizedEmail);
    } catch (welcomeError) {
      console.warn('[Brevo] Welcome email failed after subscription:', welcomeError);
    }

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
