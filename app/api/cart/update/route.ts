import { auth } from '@clerk/nextjs/server';
import { db, carts, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
}

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

    const { productId, quantity } = await req.json();

    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
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

    const existingItems = (cart.items as CartItem[]) || [];
    const updatedItems = existingItems
      .map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
      .filter((item) => item.quantity > 0);

    const newSubtotal = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await db
      .update(carts)
      .set({
        items: updatedItems,
        subtotal: String(newSubtotal),
        updatedAt: new Date(),
      })
      .where(eq(carts.id, cart.id));

    return NextResponse.json({ items: updatedItems }, { status: 200 });
  } catch (error) {
    console.error('POST /api/cart/update error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}
