// Shared product catalog. Structured to mirror the DB `products` schema so it
// can be swapped for live API data without changing the consuming components.
// Public product imagery is served via Cloudinary in production.

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
  value: string
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
  `https://images.unsplash.com/photo-${id}?w=${w}&q=85&auto=format&fit=crop`

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
  {
    id: 'p1',
    slug: 'savannah-modular-sofa',
    name: 'Savannah Modular Sofa',
    tagline: 'Low-slung modular seating in Belgian linen',
    description:
      'A sculptural, deep-seated modular sofa built on a kiln-dried hardwood frame with feather-wrapped foam cushions. Configure it to your space and finish it in your choice of premium textile.',
    price: 4200,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Sofas',
    tags: ['new-arrival', 'featured', 'best-seller'],
    images: [
      IMG('1600210492493-0946911123ea', 1200),
      IMG('1493663284031-b7e3aefcae8e'),
      IMG('1567016432779-094069958ea5'),
      IMG('1555041469-a586c61ea9bc'),
    ],
    colors: defaultColors,
    fabrics: defaultFabrics,
    addons: defaultAddons,
    rating: 4.8,
    reviewCount: 42,
    reviews: sampleReviews,
    createdAt: '2026-07-20',
    inStock: true,
  },
  {
    id: 'p2',
    slug: 'kabira-lounge-chair',
    name: 'Kabira Lounge Chair',
    tagline: 'Curved boucle lounge chair with brass base',
    description:
      'An enveloping lounge chair with a hand-curved shell, upholstered in textured boucle and set on a solid brass swivel base. A statement piece for reading corners and lounges.',
    price: 1850,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Chairs',
    tags: ['new-arrival', 'ready-to-ship'],
    images: [
      IMG('1567538096630-e0c55bd6374c', 1200),
      IMG('1506439773649-6e0eb8cfb237'),
      IMG('1519947486511-46149fa0a254'),
    ],
    colors: defaultColors,
    fabrics: defaultFabrics,
    addons: defaultAddons,
    rating: 4.9,
    reviewCount: 28,
    reviews: sampleReviews,
    createdAt: '2026-07-18',
    inStock: true,
  },
  {
    id: 'p3',
    slug: 'entebbe-dining-table',
    name: 'Entebbe Dining Table',
    tagline: 'Solid oak dining table for eight',
    description:
      'A generous solid-oak dining table with a live-edge silhouette and hand-oiled finish. Seats eight comfortably and anchors the dining room with quiet presence.',
    price: 3600,
    currency: 'USD',
    space: 'Dining Room',
    itemType: 'Tables',
    tags: ['featured', 'best-seller'],
    images: [
      IMG('1616486338812-3dadae4b4ace', 1200),
      IMG('1617806118233-18e1de247200'),
      IMG('1594026112284-02bb6f3352fe'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.7,
    reviewCount: 19,
    reviews: sampleReviews,
    createdAt: '2026-06-30',
    inStock: true,
  },
  {
    id: 'p4',
    slug: 'nile-pendant-light',
    name: 'Nile Pendant Light',
    tagline: 'Hand-blown glass pendant with brass fittings',
    description:
      'A cascading pendant of hand-blown smoked glass globes suspended from an aged-brass frame. Dimmable, with warm integrated LED modules.',
    price: 980,
    currency: 'USD',
    space: 'Dining Room',
    itemType: 'Lighting',
    tags: ['new-arrival', 'featured'],
    images: [
      IMG('1507003211169-0a1dd7228f2d', 1200),
      IMG('1524484485831-a92ffc0de03f'),
      IMG('1513506003901-1e6a229e2d15'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.6,
    reviewCount: 14,
    reviews: sampleReviews,
    createdAt: '2026-07-22',
    inStock: true,
  },
  {
    id: 'p5',
    slug: 'muyenga-platform-bed',
    name: 'Muyenga Platform Bed',
    tagline: 'Upholstered platform bed with floating frame',
    description:
      'A low-profile platform bed with a fully upholstered headboard and a floating base detail. Built for king mattresses with a slatted support system.',
    price: 2900,
    currency: 'USD',
    space: 'Bedroom',
    itemType: 'Beds',
    tags: ['best-seller', 'ready-to-ship'],
    images: [
      IMG('1631049307264-da0ec9d70304', 1200),
      IMG('1522708323590-d24dbb6b0267'),
      IMG('1560448204-e02f11c3d0e2'),
    ],
    colors: defaultColors,
    fabrics: defaultFabrics,
    addons: defaultAddons,
    rating: 4.8,
    reviewCount: 33,
    reviews: sampleReviews,
    createdAt: '2026-06-15',
    inStock: true,
  },
  {
    id: 'p6',
    slug: 'kololo-sideboard',
    name: 'Kololo Sideboard',
    tagline: 'Fluted-front storage credenza',
    description:
      'A fluted-oak credenza with soft-close doors, adjustable shelving, and a concealed cable channel. Equally at home in a dining room or living space.',
    price: 2400,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Storage',
    tags: ['new-arrival'],
    images: [
      IMG('1594620302200-9a762244a156', 1200),
      IMG('1533090161767-e6ffed986c88'),
      IMG('1595428774223-ef52624120d2'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.5,
    reviewCount: 11,
    reviews: sampleReviews,
    createdAt: '2026-07-25',
    inStock: true,
  },
  {
    id: 'p7',
    slug: 'terrace-outdoor-set',
    name: 'Terrace Outdoor Set',
    tagline: 'Weatherproof lounge set in teak & rope',
    description:
      'A three-piece outdoor lounge set in FSC-certified teak with UV-stable rope detailing and quick-dry performance cushions. Built to weather the elements.',
    price: 3200,
    currency: 'USD',
    space: 'Outdoor',
    itemType: 'Sofas',
    tags: ['featured', 'ready-to-ship'],
    images: [
      IMG('1600566753086-00f18fb6b3ea', 1200),
      IMG('1600585154340-be6161a56a0c'),
      IMG('1600607687920-4e2a09cf159d'),
    ],
    colors: defaultColors,
    fabrics: defaultFabrics,
    addons: defaultAddons,
    rating: 4.7,
    reviewCount: 22,
    reviews: sampleReviews,
    createdAt: '2026-07-10',
    inStock: true,
  },
  {
    id: 'p8',
    slug: 'arch-floor-mirror',
    name: 'Arch Floor Mirror',
    tagline: 'Full-length arched mirror with thin brass frame',
    description:
      'A full-length arched floor mirror framed in slim aged brass. Leans elegantly against the wall to open up entryways and dressing areas.',
    price: 720,
    currency: 'USD',
    space: 'Entryway',
    itemType: 'Mirrors',
    tags: ['new-arrival', 'best-seller'],
    images: [
      IMG('1618220179428-22790b461013', 1200),
      IMG('1616627561950-9f746e330187'),
      IMG('1616486029423-aaa4789e8c9a'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.9,
    reviewCount: 47,
    reviews: sampleReviews,
    createdAt: '2026-07-24',
    inStock: true,
  },
  {
    id: 'p9',
    slug: 'savannah-wool-rug',
    name: 'Savannah Wool Rug',
    tagline: 'Hand-knotted wool rug, tonal geometric',
    description:
      'A hand-knotted 100% wool rug with a subtle tonal geometric motif and a dense, plush pile. Made to soften and define open-plan spaces.',
    price: 1600,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Rugs',
    tags: ['featured'],
    images: [
      IMG('1600166898405-da9535204843', 1200),
      IMG('1603204077779-bed963ea7d0e'),
      IMG('1584285405429-136bf988919c'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.6,
    reviewCount: 16,
    reviews: sampleReviews,
    createdAt: '2026-05-30',
    inStock: true,
  },
  {
    id: 'p10',
    slug: 'studio-work-desk',
    name: 'Studio Work Desk',
    tagline: 'Minimal oak desk with leather inlay',
    description:
      'A minimal home-office desk in solid oak with a hand-stitched leather writing inlay and a discreet cable tray. Designed for focus.',
    price: 1450,
    currency: 'USD',
    space: 'Office',
    itemType: 'Tables',
    tags: ['new-arrival', 'ready-to-ship'],
    images: [
      IMG('1518455027359-f3f8164ba6bd', 1200),
      IMG('1595515106969-1ce29566ff1c'),
      IMG('1544140708-514b7837e6b5'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.7,
    reviewCount: 9,
    reviews: sampleReviews,
    createdAt: '2026-07-26',
    inStock: true,
  },
  {
    id: 'p11',
    slug: 'sculpt-table-lamp',
    name: 'Sculpt Table Lamp',
    tagline: 'Ceramic table lamp with linen shade',
    description:
      'A hand-thrown ceramic table lamp with an organic silhouette and a natural linen drum shade. Warm, diffused light for bedside and console styling.',
    price: 380,
    currency: 'USD',
    space: 'Bedroom',
    itemType: 'Lighting',
    tags: ['best-seller'],
    images: [
      IMG('1543198126-a4d9f8b7d0e5', 1200),
      IMG('1517991104123-1d56a6e81ed9'),
      IMG('1530603907829-659ab8f6e0c6'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.8,
    reviewCount: 25,
    reviews: sampleReviews,
    createdAt: '2026-06-08',
    inStock: true,
  },
  {
    id: 'p12',
    slug: 'objet-vase-trio',
    name: 'Objet Vase Trio',
    tagline: 'Set of three sculptural stoneware vases',
    description:
      'A curated trio of sculptural stoneware vases in complementary matte glazes. Sold as a set to style shelves, consoles, and dining tables.',
    price: 260,
    currency: 'USD',
    space: 'Living Room',
    itemType: 'Decor',
    tags: ['new-arrival', 'featured'],
    images: [
      IMG('1578500494198-246f612d3b3d', 1200),
      IMG('1602028915047-37269d1a73f7'),
      IMG('1581783898377-1c85bf937427'),
    ],
    colors: defaultColors,
    fabrics: [],
    addons: defaultAddons,
    rating: 4.5,
    reviewCount: 12,
    reviews: sampleReviews,
    createdAt: '2026-07-27',
    inStock: true,
  },
]

/** Returns products sorted newest-first. */
export function getByRecency(list: Product[] = products): Product[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/**
 * New Arrivals is computed dynamically: any product explicitly tagged
 * `new-arrival`, PLUS the most recently created products. This means the
 * homepage tag automatically updates whenever newer products are added.
 */
export function getNewArrivals(limit = 8): Product[] {
  const tagged = products.filter((p) => p.tags.includes('new-arrival'))
  const recent = getByRecency().slice(0, limit)
  const merged = [...tagged, ...recent]
  const unique = Array.from(new Map(merged.map((p) => [p.id, p])).values())
  return getByRecency(unique).slice(0, limit)
}

const NEW_WINDOW_DAYS = 30

/** Whether a product should visually carry the "New Arrivals" tag. */
export function isNewArrival(product: Product): boolean {
  if (product.tags.includes('new-arrival')) return true
  const ageMs = Date.now() - new Date(product.createdAt).getTime()
  return ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.id !== product.id && (p.space === product.space || p.itemType === product.itemType))
    .slice(0, limit)
}

export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}
