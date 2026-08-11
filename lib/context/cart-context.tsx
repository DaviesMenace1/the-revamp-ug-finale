 'use client';

import React, { createContext, useContext, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

function ShareHydrator({ 
  onRestore 
}: { 
  onRestore: (items: CartItem[], name?: string) => void 
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shareData = searchParams.get('c'); // 'c' instead of 'share' for shorter URL
    const nameParam = searchParams.get('name');

    if (!shareData) return;

    try {
      const decodedJson = atob(decodeURIComponent(shareData));
      const sharedItems = JSON.parse(decodedJson);

      if (Array.isArray(sharedItems) && sharedItems.length > 0) {
        // If sharedItems is short payload, restore structure
        const restored: CartItem[] = sharedItems.map((s: any) => {
          if (s.product) return s; // Full object fallback
          return {
            productId: s.i,
            quantity: s.q,
            selectedColor: s.c ? { id: s.c, name: s.c } : undefined,
            selectedVariant: s.v ? { id: s.v, name: s.v } : undefined,
            selectedAccessories: Array.isArray(s.a) ? s.a.map((acc: string) => ({ id: acc, name: acc })) : [],
            customDimensions: s.d,
            product: s.p || {
              id: s.i,
              name: s.n || 'Product',
              price: s.pr || 0,
              currency: s.cur || '$',
              images: s.img ? [s.img] : [],
              slug: s.s || ''
            }
          };
        });

        onRestore(restored, nameParam || undefined);
        
        // Clean URL params
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Failed to decode short cart link:', error);
    }
  }, [searchParams, onRestore]);

  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('revamp-cart');
    const savedName = localStorage.getItem('revamp-customer-name');
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)); } catch (e) {}
    }
    if (savedName) setCustomerName(savedName);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('revamp-cart', JSON.stringify(items));
      localStorage.setItem('revamp-customer-name', customerName);
    }
  }, [items, customerName, isLoaded]);

  const calculateTotals = (cartItems: CartItem[]) => {
    const subtotal = cartItems.reduce((total, item) => {
      const itemPrice = item.product.salePrice || item.product.price;
      return total + itemPrice * item.quantity;
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

  const removeFromCart = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  };
  const clearCart = () => setItems([]);

  const totals = calculateTotals(items);

  return (
    <CartContext.Provider
      value={{
        cart: { id: 'temp-cart', userId: 'guest', items, ...totals, updatedAt: new Date() },
        items,
        customerName,
        setCustomerName,
        addToCart,
        removeFromCart,
        removeItem: removeFromCart,
        updateQuantity,
        clearCart,
        cartCount: items.reduce((count, item) => count + item.quantity, 0),
        cartTotal: totals.total,
        subtotal: totals.subtotal,
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
