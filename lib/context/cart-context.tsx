'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import type {
  Accessory,
  Cart,
  CartContextType,
  CartItem,
  Color,
  CustomDimensions,
  Product,
  Variant,
} from '@/lib/types'
import { normalizeCurrency, resolveProductImageUrls } from '@/lib/utils'

export const CartContext = createContext<CartContextType | undefined>(undefined)

const GUEST_CART_KEY = 'revamp-cart-guest'
const LEGACY_CART_KEY = 'revamp-cart'
const CUSTOMER_NAME_KEY = 'revamp-customer-name'

function cleanNumber(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

/**
 * Creates a deterministic identity for a product configuration.
 *
 * Example:
 *
 * Sofa + Ivory + Boucle + 240x90x80
 *
 * is different from:
 *
 * Sofa + Charcoal + Linen + 240x90x80
 */
function createCartItemId(
  productId: string,
  options: {
    colorId?: string
    fabricId?: string
    materialId?: string
    variantId?: string
    accessoryIds?: string[]
    dimensions?: CustomDimensions
  }
) {
  const normalized = {
    productId,
    colorId: options.colorId || null,
    fabricId: options.fabricId || null,
    materialId: options.materialId || null,
    variantId: options.variantId || null,
    accessoryIds: [...(options.accessoryIds || [])].sort(),
    dimensions: options.dimensions || null,
  }

  return `cart_${btoa(
    encodeURIComponent(JSON.stringify(normalized))
  )
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 100)}`
}

function getOptionPrice(option?: any) {
  if (!option) return 0

  return cleanNumber(
    option.priceDelta ??
      option.price ??
      0
  )
}

function getProductBasePrice(product: Product) {
  return cleanNumber(
    product.salePrice ??
      product.price ??
      0
  )
}

function getUnitPrice(
  product: Product,
  selectedVariant?: Variant,
  selectedFabric?: Variant,
  selectedMaterial?: Variant,
  selectedAccessories: Accessory[] = []
) {
  let price = getProductBasePrice(product)

  if (selectedVariant) {
    price += getOptionPrice(selectedVariant)
  }

  if (selectedFabric) {
    price += getOptionPrice(selectedFabric)
  }

  if (selectedMaterial) {
    price += getOptionPrice(selectedMaterial)
  }

  for (const accessory of selectedAccessories) {
    price += getOptionPrice(accessory)
  }

  return price
}

function normalizeCartItem(item: any): CartItem | null {
  if (!item?.productId && !item?.product?.id && !item?.id) return null

  const productId = String(item.productId || item.product?.id || item.id)
  const embeddedProduct = item.product && typeof item.product === 'object' ? item.product : null
  const product = embeddedProduct || {
    id: productId,
    slug: String(item.slug || productId),
    name: String(item.name || 'Saved selection'),
    price: cleanNumber(item.price ?? item.unitPrice, 0),
    currency: normalizeCurrency(item.currency),
    images: item.image ? [String(item.image)] : [],
    thumbnailImage: item.image ? String(item.image) : undefined,
  }

  const selectedAccessories = Array.isArray(item.selectedAccessories)
    ? item.selectedAccessories
    : []

  const cartItemId =
    item.cartItemId ||
    createCartItemId(productId, {
      colorId: item.selectedColor?.id,
      fabricId: item.selectedFabric?.id,
      materialId: item.selectedMaterial?.id,
      variantId: item.selectedVariant?.id,
      accessoryIds: selectedAccessories.map((a: any) => a?.id).filter(Boolean),
      dimensions: item.customDimensions,
    })

  return {
    ...item,
    productId,
    product,
    unavailable: !embeddedProduct,
    cartItemId,
    quantity: Math.max(1, cleanNumber(item.quantity, 1)),
    selectedAccessories,
    unitPrice: cleanNumber(
      item.unitPrice ??
        item.calculatedUnitPrice ??
        item.product?.salePrice ??
        item.product?.price ??
        item.price,
      0
    ),
  }
}

function readLocalCart(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key)

    if (!raw) return []

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed
      .map(normalizeCartItem)
      .filter(Boolean) as CartItem[]
  } catch {
    return []
  }
}

function isAuthRoute(pathname: string | null) {
  if (!pathname) return false
  return pathname === '/sign-in' || pathname.startsWith('/sign-in/') || pathname === '/sign-up' || pathname.startsWith('/sign-up/') || pathname === '/reset-password' || pathname === '/login' || pathname === '/signup'
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  if (isAuthRoute(pathname)) return <>{children}</>
  return <AuthenticatedCartProvider>{children}</AuthenticatedCartProvider>
}

function AuthenticatedCartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, isLoaded: isAuthLoaded } = useAuth()

  const [items, setItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  const cartStorageKey = userId
    ? `revamp-cart-${userId}`
    : GUEST_CART_KEY

  const nameStorageKey = userId
    ? `revamp-name-${userId}`
    : CUSTOMER_NAME_KEY

  /**
   * Load the local cart first.
   * This prevents the cart from appearing empty while authentication loads.
   */
  useEffect(() => {
    if (!isAuthLoaded) return

    const storedItems = readLocalCart(cartStorageKey)
    const localItems = storedItems.length > 0 ? storedItems : readLocalCart(LEGACY_CART_KEY)

    setItems(localItems)

    const savedName =
      localStorage.getItem(nameStorageKey) ||
      localStorage.getItem(CUSTOMER_NAME_KEY)

    if (savedName) {
      setCustomerName(savedName)
    }

    setIsLoaded(true)
  }, [isAuthLoaded, cartStorageKey, nameStorageKey])

  /**
   * Persist cart locally and synchronize with the authenticated cart API.
   */
  useEffect(() => {
    if (!isLoaded || !isAuthLoaded) return

    localStorage.setItem(
      cartStorageKey,
      JSON.stringify(items)
    )

    localStorage.setItem(
      nameStorageKey,
      customerName
    )

    if (!userId) return

    const timeout = window.setTimeout(() => {
      fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
        }),
      }).catch((error) => {
        console.error(
          'Failed to synchronize cart:',
          error
        )
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [
    items,
    customerName,
    isLoaded,
    isAuthLoaded,
    userId,
    cartStorageKey,
    nameStorageKey,
  ])

  const addToCart = useCallback(
    (
      product: Product,
      quantity: number,
      selectedColor?: Color,
      selectedVariant?: Variant,
      selectedAccessories: Accessory[] = [],
      customDimensions?: CustomDimensions,
      selectedFabric?: Variant,
      selectedMaterial?: Variant
    ) => {
      const safeQuantity = Math.max(
        1,
        Math.floor(cleanNumber(quantity, 1))
      )

      const unitPrice = getUnitPrice(
        product,
        selectedVariant,
        selectedFabric,
        selectedMaterial,
        selectedAccessories
      )

      const cartItemId = createCartItemId(
        product.id,
        {
          colorId: selectedColor?.id,
          fabricId: selectedFabric?.id,
          materialId: selectedMaterial?.id,
          variantId: selectedVariant?.id,
          accessoryIds: selectedAccessories
            .map((a) => a.id)
            .filter(Boolean),
          dimensions: customDimensions,
        }
      )

      const image = selectedColor?.image || selectedVariant?.image || resolveProductImageUrls(product)[0]

      setItems((previous) => {
        const existingIndex = previous.findIndex(
          (item) => item.cartItemId === cartItemId
        )

        if (existingIndex !== -1) {
          return previous.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity:
                    item.quantity + safeQuantity,
                }
              : item
          )
        }

        const item: CartItem = {
          cartItemId,
          productId: product.id,
          product,
          quantity: safeQuantity,

          selectedColor,
          selectedFabric,
          selectedMaterial,
          selectedVariant,
          selectedAccessories,

          customDimensions,

          unitPrice,
          currency: normalizeCurrency(product.currency),
          image,

          selectedOptions: {
            color: selectedColor?.label || selectedColor?.name,
            fabric: selectedFabric?.label || selectedFabric?.name,
            material:
              selectedMaterial?.label ||
              selectedMaterial?.name,
            variant:
              selectedVariant?.label ||
              selectedVariant?.name,
            accessories: selectedAccessories.map(
              (accessory) =>
                accessory.label ||
                accessory.name
            ),
            dimensions: customDimensions,
          },
        }

        return [...previous, item]
      })
    },
    []
  )

  const removeFromCart = useCallback(
    (cartItemId: string) => {
      setItems((previous) =>
        previous.filter(
          (item) => item.cartItemId !== cartItemId
        )
      )
    },
    []
  )

  const removeItem = removeFromCart

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      const safeQuantity = Math.floor(
        cleanNumber(quantity, 0)
      )

      if (safeQuantity <= 0) {
        removeFromCart(cartItemId)
        return
      }

      setItems((previous) =>
        previous.map((item) =>
          item.cartItemId === cartItemId
            ? {
                ...item,
                quantity: safeQuantity,
              }
            : item
        )
      )
    },
    [removeFromCart]
  )

  const clearCart = useCallback(() => {
    setItems([])

    if (typeof window !== 'undefined') {
      localStorage.setItem(cartStorageKey, '[]')
      localStorage.removeItem(LEGACY_CART_KEY)
    }

    if (userId) {
      void fetch('/api/cart/clear', { method: 'POST' }).catch((error) => {
        console.error('Failed to clear the server cart after payment:', error)
      })
    }
  }, [cartStorageKey, userId])

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => {
        const price = cleanNumber(
          item.unitPrice ??
            item.product?.salePrice ??
            item.product?.price,
          0
        )

        return sum + price * item.quantity
      },
      0
    )

    /*
     * Keep these values configurable later.
     * For now shipping remains zero because most
     * Revamp products require a quote/delivery calculation.
     */
    const tax = 0
    const shipping = 0
    const total = subtotal + tax + shipping

    return {
      subtotal,
      tax,
      shipping,
      total,
    }
  }, [items])

  const cart: Cart = {
    id: userId
      ? `cart-${userId}`
      : 'guest-cart',
    userId: userId || 'guest',
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    shipping: totals.shipping,
    total: totals.total,
    updatedAt: new Date(),
  }

  const cartCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        items,

        customerName,
        setCustomerName,

        addToCart,
        removeFromCart,
        removeItem,
        updateQuantity,
        clearCart,

        cartCount,
        cartTotal: totals.total,
        subtotal: totals.subtotal,

        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error(
      'useCart must be used within CartProvider'
    )
  }

  return context
}