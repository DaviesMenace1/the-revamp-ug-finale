import { auth } from '@clerk/nextjs/server';
import { db, carts, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    await db
      .update(carts)
      .set({
        items: [],
        subtotal: 0,
        updatedAt: new Date(),
      })
      .where(eq(carts.id, cart.id));

    return NextResponse.json({ items: [] }, { status: 200 });
  } catch (error) {
    console.error('POST /api/cart/clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
