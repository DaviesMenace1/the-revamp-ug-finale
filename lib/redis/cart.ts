/**
 * Shopping cart stored in Upstash Redis.
 * Persists across sessions, syncs to DB on checkout.
 * TTL: 7 days — cart expires if user is inactive.
 */

import { redis } from './client';
import { CACHE_KEYS, TTL } from './cache';

const CART_TTL = TTL.DAY * 7; // 7 days

export interface CartItem {
  productId:   string;
  name:        string;
  price:       number;
  currency:    string;
  quantity:    number;
  image?:      string;
  variant?:    string;
  addedAt:     string;
}

export interface Cart {
  userId:    string;
  items:     CartItem[];
  updatedAt: string;
}

export async function getCart(userId: string): Promise<Cart> {
  const cart = await redis.get<Cart>(CACHE_KEYS.cart(userId));
  return cart ?? { userId, items: [], updatedAt: new Date().toISOString() };
}

export async function addToCart(userId: string, item: Omit<CartItem, 'addedAt'>): Promise<Cart> {
  const cart = await getCart(userId);
  const existing = cart.items.findIndex(
    (i) => i.productId === item.productId && i.variant === item.variant,
  );

  if (existing >= 0) {
    cart.items[existing].quantity += item.quantity;
  } else {
    cart.items.push({ ...item, addedAt: new Date().toISOString() });
  }

  cart.updatedAt = new Date().toISOString();
  await redis.setex(CACHE_KEYS.cart(userId), CART_TTL, JSON.stringify(cart));
  return cart;
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
  variant?: string,
): Promise<Cart> {
  const cart = await getCart(userId);
  const idx = cart.items.findIndex(
    (i) => i.productId === productId && i.variant === variant,
  );

  if (idx >= 0) {
    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
  }

  cart.updatedAt = new Date().toISOString();
  await redis.setex(CACHE_KEYS.cart(userId), CART_TTL, JSON.stringify(cart));
  return cart;
}

export async function removeFromCart(userId: string, productId: string, variant?: string): Promise<Cart> {
  return updateCartItem(userId, productId, 0, variant);
}

export async function clearCart(userId: string): Promise<void> {
  await redis.del(CACHE_KEYS.cart(userId));
}

export function getCartTotal(cart: Cart): { subtotal: number; itemCount: number; currency: string } {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const currency = cart.items[0]?.currency ?? 'UGX';
  return { subtotal, itemCount, currency };
}
