'use client';

import React, { createContext, useContext, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Cart, CartItem, Product, Color, Variant, Accessory } from '@/lib/types';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
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

// Helper component to safely read searchParams in Next.js
function ShareHydrator({ onRestore }: { onRestore: (items: CartItem[]) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shareData = searchParams.get('share');
    if (!shareData) return;

    try {
      // Decode base64 UTF-8 string safely
      const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(shareData))));
      const sharedItems: CartItem[] = JSON.parse(jsonStr);

      if (Array.isArray(sharedItems) && sharedItems.length > 0) {
        onRestore(sharedItems);
        // Clean URL parameter without reloading page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (error) {
      console.error('Failed to parse shared cart link:', error);
    }
  }, [searchParams, onRestore]);

  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('revamp-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('revamp-cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const calculateTotals = (cartItems: CartItem[]) => {
    const subtotal = cartItems.reduce((total, item) => {
      const itemPrice = item.product.salePrice || item.product.price;
      return total + itemPrice * item.quantity;
    }, 0);

    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 0 ? 150 : 0; // $150 flat shipping
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
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
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

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totals = calculateTotals(items);

  const value: CartContextType = {
    cart: {
      id: 'temp-cart',
      userId: 'guest',
      items,
      ...totals,
      updatedAt: new Date(),
    },
    items,
    addToCart,
    removeFromCart,
    removeItem: removeFromCart,
    updateQuantity,
    clearCart,
    cartCount: items.reduce((count, item) => count + item.quantity, 0),
    cartTotal: totals.total,
    subtotal: totals.subtotal,
  };

  return (
    <CartContext.Provider value={value}>
      <Suspense fallback={null}>
        <ShareHydrator onRestore={(restoredItems) => setItems(restoredItems)} />
      </Suspense>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}


{/*export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
}

export interface CartContextType {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from database on mount
  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      loadCart();
    } else {
      // Load from localStorage if not authenticated
      loadCartFromStorage();
    }
  }, [isLoaded, userId]);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      loadCartFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadCartFromStorage = () => {
    try {
      const stored = localStorage.getItem('cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCartToStorage = (cartItems: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  };

  const addItem = useCallback(
    async (newItem: CartItem) => {
      setIsLoading(true);
      try {
        if (userId) {
          const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem),
          });

          if (response.ok) {
            const data = await response.json();
            setItems(data.items);
          }
        } else {
          // Local cart for guests
          setItems((prev) => {
            const existing = prev.find((item) => item.productId === newItem.productId);
            let updated;
            if (existing) {
              updated = prev.map((item) =>
                item.productId === newItem.productId
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              );
            } else {
              updated = [...prev, newItem];
            }
            saveCartToStorage(updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Failed to add item to cart:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setIsLoading(true);
      try {
        if (userId) {
          const response = await fetch(`/api/cart/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          });

          if (response.ok) {
            const data = await response.json();
            setItems(data.items);
          }
        } else {
          setItems((prev) => {
            const updated = prev.filter((item) => item.productId !== productId);
            saveCartToStorage(updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 0) return;

      setIsLoading(true);
      try {
        if (userId) {
          const response = await fetch(`/api/cart/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
          });

          if (response.ok) {
            const data = await response.json();
            setItems(data.items);
          }
        } else {
          setItems((prev) => {
            const updated = prev.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            );
            saveCartToStorage(updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Failed to update cart item quantity:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (userId) {
        await fetch('/api/cart/clear', { method: 'POST' });
      }
      setItems([]);
      saveCartToStorage([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
} */}
