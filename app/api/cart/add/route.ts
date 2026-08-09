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

    const newItem: CartItem = await req.json();

    let cart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
    });

    if (!cart) {
      // Create new cart
      const [newCart] = await db
        .insert(carts)
        .values({
          userId: user.id,
          items: [newItem],
          subtotal: String(newItem.price * newItem.quantity),
        })
        .returning();
      return NextResponse.json({ items: newCart.items }, { status: 200 });
    }

    // Add to existing cart
    const existingItems = (cart.items as CartItem[]) || [];
    const itemIndex = existingItems.findIndex(
      (item) => item.productId === newItem.productId
    );

    let updatedItems;
    if (itemIndex > -1) {
      // Update quantity if item exists
      updatedItems = existingItems.map((item, idx) =>
        idx === itemIndex
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item
      );
    } else {
      // Add new item
      updatedItems = [...existingItems, newItem];
    }

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
    console.error('POST /api/cart/add error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}
