export interface ProductOption {
  id?: string
  label: string
  name?: string
  value?: string
  priceDelta?: number
  price?: number
  image?: string
}

export interface Color extends ProductOption {
  id: string
  hex?: string
}

export interface Variant extends ProductOption {
  id: string
  type?: 'COLOR' | 'FABRIC' | 'MATERIAL' | 'SIZE' | string
  sku?: string
  gtin?: string
  mpn?: string
  quantity?: number
  availability?: string
}

export interface Accessory extends ProductOption {
  id: string
}

export interface CustomDimensions {
  width?: number
  height?: number
  depth?: number
  unit?: string
}

export interface CartItem {
  /**
   * Unique identity for THIS configuration.
   * Two configurations of the same product must have different keys.
   */
  cartItemId: string

  productId: string
  product: Product
  quantity: number

  selectedColor?: Color
  selectedFabric?: Variant
  selectedMaterial?: Variant
  selectedVariant?: Variant
  selectedAccessories: Accessory[]

  customDimensions?: CustomDimensions

  /**
   * Snapshot values.
   * These make the cart stable even if the product is later edited.
   */
  unitPrice?: number
  image?: string
  selectedOptions?: Record<string, unknown>
  /** True when a legacy/local record lacks the embedded product snapshot. */
  unavailable?: boolean
}

export interface Product {
  id: string
  slug: string
  name: string
  tagline?: string
  description?: string
  price: number
  salePrice?: number
  currency: string

  images: string[]
  thumbnailImage?: string

  colors?: ProductOption[]
  fabrics?: ProductOption[]
  addons?: ProductOption[]

  rating?: number
  likes?: number
  reviewCount?: number

  category?: string
  categorySlug?: string
  subCategory?: string
  subCategorySlug?: string

  tags?: string[]
  createdAt?: string
  inStock?: boolean

  [key: string]: any
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

  customerName: string
  setCustomerName: (name: string) => void

  addToCart: (
    product: Product,
    quantity: number,
    selectedColor?: Color,
    selectedVariant?: Variant,
    selectedAccessories?: Accessory[],
    customDimensions?: CustomDimensions,
    selectedFabric?: Variant,
    selectedMaterial?: Variant
  ) => void

  removeFromCart: (cartItemId: string) => void
  removeItem: (cartItemId: string) => void

  updateQuantity: (cartItemId: string, quantity: number) => void

  clearCart: () => void

  cartCount: number
  cartTotal: number
  subtotal: number
  isLoaded: boolean
}