import type { Product as CatalogProduct, ProductOption } from '@/lib/data/products'

export type Product = CatalogProduct & {
  salePrice?: number | null
}

export type Color = ProductOption
export type Variant = ProductOption
export type Accessory = ProductOption

export interface CartItem {
  productId: string
  product: Product
  quantity: number
  selectedColor?: Color
  selectedVariant?: Variant
  selectedAccessories: Accessory[]
  customDimensions?: { width?: number; height?: number; depth?: number }
  name?: string
  price?: number
  image?: string
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  updatedAt: Date
}

export interface CartContextType {
  cart: Cart | null
  items: CartItem[]
  addToCart: (
    product: Product,
    quantity: number,
    selectedColor?: Color,
    selectedVariant?: Variant,
    selectedAccessories?: Accessory[],
    customDimensions?: { width?: number; height?: number; depth?: number }
  ) => void
  removeFromCart: (productId: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  subtotal: number
}
