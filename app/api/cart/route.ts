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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if a cart already exists for this user
    const existingCart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
    });

    if (existingCart) {
      // Update existing cart
      await db
        .update(carts)
        .set({
          items,
          updatedAt: new Date(),
        })
        .where(eq(carts.id, existingCart.id));
    } else {
      // Create new cart record
      await db.insert(carts).values({
        userId: user.id,
        items,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json(
      { error: 'Failed to sync cart' },
      { status: 500 }
    );
  }
}
