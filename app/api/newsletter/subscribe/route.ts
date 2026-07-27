/**
 * POST /api/newsletter/subscribe
 * Subscribe an email address to the newsletter via Brevo
 */

import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter } from '@/lib/brevo/sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName } = body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Subscribe to newsletter via Brevo
    await subscribeToNewsletter(email, firstName, lastName);

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter',
        email,
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
