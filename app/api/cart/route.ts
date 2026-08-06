import { auth } from '@clerk/nextjs/server';
import { db, carts, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
    });

    return NextResponse.json(
      { items: cart?.items || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}
