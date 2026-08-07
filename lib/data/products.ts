// Shared product catalog. Structured to mirror the DB `products` schema.
// Public product imagery is served via Cloudinary.

export type QuickTag = 'new-arrival' | 'featured' | 'best-seller' | 'ready-to-ship'

export type Space =
  | 'Living Room'
  | 'Dining Room'
  | 'Bedroom'
  | 'Office'
  | 'Outdoor'
  | 'Entryway'
  | 'Bathroom'

export type ItemType =
  | 'Sofas'
  | 'Chairs'
  | 'Tables'
  | 'Lighting'
  | 'Storage'
  | 'Beds'
  | 'Rugs'
  | 'Mirrors'
  | 'Decor'

export interface ProductOption {
  label: string
  /** hex or descriptor for swatch rendering */
  value?: string
  /** optional price delta in the product currency */
  priceDelta?: number
}

export interface ProductReview {
  id: string
  author: string
  rating: number
  date: string
  title: string
  body: string
}

export interface Product {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  price: number
  currency: string
  space: Space
  itemType: ItemType
  tags: QuickTag[]
  images: string[]
  colors: ProductOption[]
  fabrics: ProductOption[]
  addons: ProductOption[]
  rating: number
  likes: number
  reviewCount: number
  reviews: ProductReview[]
  /** ISO date — used to compute "New Arrivals" dynamically */
  createdAt: string
  inStock: boolean
}

export const SPACES: Space[] = [
  'Living Room',
  'Dining Room',
  'Bedroom',
  'Office',
  'Outdoor',
  'Entryway',
  'Bathroom',
]

export const ITEM_TYPES: ItemType[] = [
  'Sofas',
  'Chairs',
  'Tables',
  'Lighting',
  'Storage',
  'Beds',
  'Rugs',
  'Mirrors',
  'Decor',
]

export const QUICK_FILTERS: { label: string; value: QuickTag | 'all'; icon?: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'New Arrivals', value: 'new-arrival', icon: 'star' },
  { label: 'Featured', value: 'featured' },
  { label: 'Best Sellers', value: 'best-seller' },
  { label: 'Ready to Ship', value: 'ready-to-ship' },
]

const IMG = (id: string, w = 900) =>
  `https://res.cloudinary.com/r8epy5mg/image/upload/${id}.jpg`

const defaultColors: ProductOption[] = [
  { label: 'Obsidian', value: '#1c1c1c' },
  { label: 'Warm Taupe', value: '#a89a86' },
  { label: 'Ivory', value: '#f5f0e8' },
  { label: 'Forest', value: '#3a4a3f' },
]

const defaultFabrics: ProductOption[] = [
  { label: 'Belgian Linen', value: 'linen' },
  { label: 'Boucle', value: 'boucle', priceDelta: 120 },
  { label: 'Full-Grain Leather', value: 'leather', priceDelta: 450 },
  { label: 'Performance Velvet', value: 'velvet', priceDelta: 200 },
]

const defaultAddons: ProductOption[] = [
  { label: 'White-Glove Delivery', value: 'delivery', priceDelta: 180 },
  { label: 'Assembly & Installation', value: 'install', priceDelta: 250 },
  { label: 'Fabric Protection', value: 'protection', priceDelta: 90 },
  { label: 'Extended Warranty (5yr)', value: 'warranty', priceDelta: 150 },
]

const sampleReviews: ProductReview[] = [
  {
    id: 'r1',
    author: 'Sanyu N.',
    rating: 5,
    date: '2026-06-12',
    title: 'Exceptional craftsmanship',
    body: 'The finish is flawless and the material quality exceeded my expectations. Delivery and installation were seamless.',
  },
  {
    id: 'r2',
    author: 'Brian K.',
    rating: 4,
    date: '2026-05-28',
    title: 'Beautiful, worth the wait',
    body: 'Took a few weeks to source but the piece anchors our living room perfectly. Would order again.',
  },
]

export const products: Product[] = [
  // 1. SOFAS
  {
    id: 'p1',
    slug: 'savannah-modular-sofa',
    name: 'Savannah Modular Sofa',
    tagline: 'Low-slung modular seating in Belgian linen',
    description:
      'A sculptural, deep-seated modular sofa built on a kiln-dried hardwood frame with feather-wrapped foam cushions.',
    price: 4200,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Sofas',
    tags: ['new-arrival', 'featured', 'best-seller'],
    images: [
      IMG('70cb96cf894b07f22c2b4e03843d60_nrigo8', 1200),
      IMG('5f5c41f087539fc2821a6f05e55eed_tt543y'),
    ],
    colors: defaultColors,
    fabrics: defaultFabrics,
    addons: defaultAddons,
    rating: 4.8,
    likes: 124,
    reviewCount: 42,
    reviews: sampleReviews,
    createdAt: '2026-07-20',
    inStock: true,
  },
  // 2. CHAIRS
  {
    id: 'p2',
    slug: 'kabira-lounge-chair',
    name: 'Kabira Lounge Chair',
    tagline: 'Curved boucle lounge chair with brass base',
    description:
      'An enveloping lounge chair with a hand-curved shell, upholstered in textured boucle and set on a solid brass swivel base.',
    price: 1850,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Chairs',
    tags: ['new-arrival', 'ready-to-ship'],
    images: [
      IMG('5f5c41f087539fc2821a6f05e55eed_tt543y', 1200),
    ],
    colors: defaultColors,
    fabrics: defaultFabrics,
    addons: defaultAddons,
    rating: 4.9,
    likes: 89,
    reviewCount: 28,
    reviews: sampleReviews,
    createdAt: '2026-07-18',
    inStock: true,
  },
  // 3. TABLES
  {
    id: 'p3',
    slug: 'entebbe-dining-table',
    name: 'Entebbe Dining Table',
    tagline: 'Solid oak dining table for eight',
    description:
      'A generous solid-oak dining table with a live-edge silhouette and hand-oiled finish. Seats eight comfortably.',
    price: 3600,
    currency: 'USD',
    space: 'Dining Room',
    itemType: 'Tables',
    tags: ['featured', 'best-seller'],
    images: [
      IMG('L3D124S57ENDOVMISTQUWIKKELUFX73ONXQ8_4000x3000_mua1j5', 1200),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.7,
    likes: 210,
    reviewCount: 19,
    reviews: sampleReviews,
    createdAt: '2026-06-30',
    inStock: true,
  },
  // 4. LIGHTING
  {
    id: 'p4',
    slug: 'nile-pendant-light',
    name: 'Nile Pendant Light',
    tagline: 'Hand-blown glass pendant with brass fittings',
    description:
      'A cascading pendant of hand-blown smoked glass globes suspended from an aged-brass frame. Dimmable LED modules.',
    price: 980,
    currency: 'USD',
    space: 'Dining Room',
    itemType: 'Lighting',
    tags: ['new-arrival', 'featured'],
    images: [
      IMG('L3D124S57ENDOVL4HFQUWLZS6LUFX7YSLLQ8_4000x3000_guugcz', 1200),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.6,
    likes: 67,
    reviewCount: 14,
    reviews: sampleReviews,
    createdAt: '2026-07-22',
    inStock: true,
  },
  // 5. BEDS
  {
    id: 'p5',
    slug: 'muyenga-platform-bed',
    name: 'Muyenga Platform Bed',
    tagline: 'Upholstered platform bed with floating frame',
    description:
      'A low-profile platform bed with a fully upholstered headboard and a floating base detail. Slatted support system.',
    price: 2900,
    currency: 'USD',
    space: 'Bedroom',
    itemType: 'Beds',
    tags: ['best-seller', 'ready-to-ship'],
    images: [
      IMG('L3D124S57ENDOVL2NOAUWIF6ILUFX7Y2USY8_4000x3000_dj0nbl', 1200),
    ],
    colors: defaultColors,
    fabrics: defaultFabrics,
    addons: defaultAddons,
    rating: 4.8,
    likes: 156,
    reviewCount: 33,
    reviews: sampleReviews,
    createdAt: '2026-06-15',
    inStock: true,
  },
  // 6. STORAGE
  {
    id: 'p6',
    slug: 'kololo-sideboard',
    name: 'Kololo Sideboard Credenza',
    tagline: 'Fluted-front storage credenza',
    description:
      'A fluted-oak credenza with soft-close doors, adjustable shelving, and a concealed cable channel.',
    price: 2400,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Storage',
    tags: ['new-arrival'],
    images: [
      IMG('IMG_3831_3_hd9rfe', 1200),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.5,
    likes: 43,
    reviewCount: 11,
    reviews: sampleReviews,
    createdAt: '2026-07-25',
    inStock: true,
  },
  // 7. RUGS
  {
    id: 'p9',
    slug: 'savannah-wool-rug',
    name: 'Savannah Wool Rug',
    tagline: 'Hand-knotted wool rug, tonal geometric',
    description:
      'A hand-knotted 100% wool rug with a subtle tonal geometric motif and a dense, plush pile.',
    price: 1600,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Rugs',
    tags: ['featured', 'ready-to-ship'],
    images: [
      IMG('IMG_3760_1_amgiep', 1200),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.6,
    likes: 92,
    reviewCount: 16,
    reviews: sampleReviews,
    createdAt: '2026-05-30',
    inStock: true,
  },
  // 8. MIRRORS
  {
    id: 'p8',
    slug: 'arch-floor-mirror',
    name: 'Arch Floor Mirror',
    tagline: 'Full-length arched mirror with thin brass frame',
    description:
      'A full-length arched floor mirror framed in slim aged brass. Leans elegantly against the wall.',
    price: 720,
    currency: 'USD',
    space: 'Entryway',
    itemType: 'Mirrors',
    tags: ['new-arrival', 'best-seller'],
    images: [
      IMG('IMG_3738_4_eeqdtd', 1200),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.9,
    likes: 310,
    reviewCount: 47,
    reviews: sampleReviews,
    createdAt: '2026-07-24',
    inStock: true,
  },
  // 9. DECOR
  {
    id: 'p12',
    slug: 'objet-vase-trio',
    name: 'Objet Vase Trio',
    tagline: 'Set of three sculptural stoneware vases',
    description:
      'A curated trio of sculptural stoneware vases in complementary matte glazes.',
    price: 260,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Decor',
    tags: ['new-arrival', 'featured'],
    images: [
      IMG('4708E4D2-D548-4584-A21E-17DCD016562A_yfukav', 1200),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.5,
    likes: 78,
    reviewCount: 12,
    reviews: sampleReviews,
    createdAt: '2026-07-27',
    inStock: true,
  },
]

/** Helper utilities (Guarded against undefined/null) */
export function getByRecency(list: Product[] = products): Product[] {
  if (!Array.isArray(list)) return []
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getNewArrivals(limit = 8): Product[] {
  if (!Array.isArray(products)) return []
  const tagged = products.filter((p) => p.tags?.includes('new-arrival'))
  const recent = getByRecency().slice(0, limit)
  const merged = [...tagged, ...recent]
  const unique = Array.from(new Map(merged.map((p) => [p.id, p])).values())
  return getByRecency(unique).slice(0, limit)
}

export function getProductBySlug(slug: string): Product | undefined {
  if (!Array.isArray(products)) return undefined
  return products.find((p) => p.slug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  if (!product || !Array.isArray(products)) return []
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.space === product.space || p.itemType === product.itemType),
    )
    .slice(0, limit)
}

export function isNewArrival(product: Product): boolean {
  if (!product?.tags) return false
  return product.tags.includes('new-arrival')
}

export function formatPrice(price: number, currency = 'USD'): string {
  if (typeof price !== 'number') return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}
