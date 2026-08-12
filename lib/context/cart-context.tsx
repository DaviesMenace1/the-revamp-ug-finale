'use client';

import React, { createContext, useContext, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Cart, CartItem, Product, Color, Variant, Accessory } from '@/lib/types';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  addToCart: (
    product: Product,
    quantity: number,
    selectedColor?: Color,
    selectedVariant?: Variant,
    selectedAccessories?: Accessory[],
    customDimensions?: { width?: number; height?: number; depth?: number }
  ) => void;
  removeFromCart: (productId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  subtotal: number;
  isLoaded: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

function ShareHydrator({
  onRestore,
}: {
  onRestore: (items: CartItem[], name?: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shareData = searchParams.get('c');
    const nameParam = searchParams.get('name');

    if (!shareData) return;

    try {
      const decodedJson = atob(decodeURIComponent(shareData));
      const sharedItems = JSON.parse(decodedJson);

      if (Array.isArray(sharedItems) && sharedItems.length > 0) {
        const restored: CartItem[] = sharedItems.map((s: any) => {
          if (s.product) return s;
          return {
            productId: s.i,
            quantity: s.q,
            selectedColor: s.c ? { id: s.c, name: s.c } : undefined,
            selectedVariant: s.v ? { id: s.v, name: s.v } : undefined,
            selectedAccessories: Array.isArray(s.a)
              ? s.a.map((acc: string) => ({ id: acc, name: acc }))
              : [],
            customDimensions: s.d,
            product: s.p || {
              id: s.i,
              name: s.n || 'Product',
              price: s.pr || 0,
              currency: s.cur || '$',
              images: s.img ? [s.img] : [],
              slug: s.s || '',
            },
          };
        });

        onRestore(restored, nameParam || undefined);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Failed to decode short cart link:', error);
    }
  }, [searchParams, onRestore]);

  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  const cartStorageKey = userId ? `revamp-cart-${userId}` : 'revamp-cart-guest';
  const nameStorageKey = userId ? `revamp-name-${userId}` : 'revamp-customer-name';

  // 1. Instant Local Read & Safe DB Sync
  useEffect(() => {
    if (!isAuthLoaded) return;

    // Immediately read local storage so the cart UI doesn't flash empty
    let initialItems: CartItem[] = [];
    const savedCart = localStorage.getItem(cartStorageKey) || localStorage.getItem('revamp-cart');
    const savedName = localStorage.getItem(nameStorageKey) || localStorage.getItem('revamp-customer-name');

    if (savedCart) {
      try {
        initialItems = JSON.parse(savedCart);
      } catch (e) {
        initialItems = [];
      }
    }

    setItems(initialItems);
    if (savedName) setCustomerName(savedName);
    setIsLoaded(true);

    // If logged in, sync with API in the background without clearing current state
    if (userId) {
      async function syncWithDb() {
        try {
          const guestCart = localStorage.getItem('revamp-cart-guest') || localStorage.getItem('revamp-cart');
          const guestItems: CartItem[] = guestCart ? JSON.parse(guestCart) : [];

          const res = await fetch('/api/cart');
          if (res.ok) {
            const data = await res.json();
            let serverItems: CartItem[] = data.items || [];

            if (guestItems.length > 0) {
              const mergedMap = new Map<string, CartItem>();
              serverItems.forEach((item) => mergedMap.set(item.productId, item));
              guestItems.forEach((item) => {
                if (mergedMap.has(item.productId)) {
                  const existing = mergedMap.get(item.productId)!;
                  mergedMap.set(item.productId, {
                    ...existing,
                    quantity: existing.quantity + item.quantity,
                  });
                } else {
                  mergedMap.set(item.productId, item);
                }
              });

              serverItems = Array.from(mergedMap.values());
              localStorage.removeItem('revamp-cart-guest');
              localStorage.removeItem('revamp-cart');

              await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: serverItems }),
              });
            }

            setItems(serverItems);
          }
        } catch (error) {
          console.error('Failed to sync database cart:', error);
        }
      }

      syncWithDb();
    }
  }, [userId, isAuthLoaded, cartStorageKey, nameStorageKey]);

  // 2. Persist State Edits Safely
  useEffect(() => {
    if (!isLoaded || !isAuthLoaded) return;

    localStorage.setItem(cartStorageKey, JSON.stringify(items));
    localStorage.setItem(nameStorageKey, customerName);

    if (userId) {
      const syncTimeout = setTimeout(() => {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        }).catch((err) => console.error('Failed to sync cart updates:', err));
      }, 300);

      return () => clearTimeout(syncTimeout);
    }
  }, [items, customerName, isLoaded, isAuthLoaded, userId, cartStorageKey, nameStorageKey]);

  // 3. Defensive Totals Calculation (Guards against NaN crashes)
  const calculateTotals = (cartItems: CartItem[]) => {
    const subtotal = cartItems.reduce((total, item) => {
      if (!item?.product) return total;

      const rawPrice = item.product.salePrice ?? item.product.price ?? 0;
      const itemPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice);

      const safePrice = isNaN(itemPrice) ? 0 : itemPrice;
      const safeQuantity = Number(item.quantity) || 1;

      return total + safePrice * safeQuantity;
    }, 0);

    const tax = subtotal * 0.1;
    const shipping = subtotal > 0 ? 150 : 0;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  };

  const addToCart = (
    product: Product,
    quantity: number,
    selectedColor?: Color,
    selectedVariant?: Variant,
    selectedAccessories?: Accessory[],
    customDimensions?: { width?: number; height?: number; depth?: number }
  ) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prevItems,
        {
          productId: product.id,
          product,
          quantity,
          selectedColor,
          selectedVariant,
          selectedAccessories: selectedAccessories || [],
          customDimensions,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totals = calculateTotals(items);

  return (
    <CartContext.Provider
      value={{
        cart: {
          id: 'temp-cart',
          userId: userId || 'guest',
          items,
          ...totals,
          updatedAt: new Date(),
        },
        items,
        customerName,
        setCustomerName,
        addToCart,
        removeFromCart,
        removeItem: removeFromCart,
        updateQuantity,
        clearCart,
        cartCount: items.reduce((count, item) => count + (Number(item.quantity) || 0), 0),
        cartTotal: totals.total,
        subtotal: totals.subtotal,
        isLoaded,
      }}
    >
      <Suspense fallback={null}>
        <ShareHydrator
          onRestore={(restoredItems, name) => {
            setItems(restoredItems);
            if (name) setCustomerName(name);
          }}
        />
      </Suspense>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
