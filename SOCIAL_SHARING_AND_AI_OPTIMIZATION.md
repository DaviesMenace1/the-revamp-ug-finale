# Social Sharing & AI Search Optimization Requirements

## Phase 5: Social Media Sharing & E-Commerce

### 1. Social Media Sharing (Products, Projects, Blogs)

**Share Button Implementation:**
- Add social share buttons on all shareable content:
  - Facebook
  - Twitter/X
  - LinkedIn
  - Instagram (save to collection)
  - Pinterest
  - WhatsApp
  - Email
  - Copy Link

**Location on Pages:**
- Product Detail: Share buttons in product info section
- Project Detail: Share buttons in project header
- Blog/Journal: Share buttons near title and at end of article
- Mobile: Fixed share bar at bottom (sticky)
- Desktop: Share buttons inline with content

**Dynamic OpenGraph Meta Tags:**

```html
<!-- Product Example -->
<meta property="og:title" content="[Product Name]" />
<meta property="og:description" content="[Product description first 160 chars]" />
<meta property="og:image" content="[Product image - 1200x630px]" />
<meta property="og:url" content="[Full product URL]" />
<meta property="og:type" content="product" />
<meta property="og:price:amount" content="[Price]" />
<meta property="og:price:currency" content="USD" />

<!-- Project Example -->
<meta property="og:title" content="[Project Name] - Interior Design" />
<meta property="og:description" content="[Location, style, scope]" />
<meta property="og:image" content="[Hero image - 1200x630px]" />
<meta property="og:type" content="website" />

<!-- Article Example -->
<meta property="og:title" content="[Article Title]" />
<meta property="og:description" content="[Article excerpt]" />
<meta property="og:image" content="[Featured image]" />
<meta property="og:type" content="article" />
<meta property="article:published_time" content="[Date]" />
<meta property="article:author" content="[Author]" />
```

**Twitter Card Meta Tags:**

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Title]" />
<meta name="twitter:description" content="[Description]" />
<meta name="twitter:image" content="[Image - 1200x675px]" />
<meta name="twitter:creator" content="@therevampug" />
```

**Pinterest Optimization:**
- Image sizes: 1000x1500px (2:3 ratio preferred)
- Rich pins enabled (product, article, recipe)
- Description field populated
- "Pin It" button on all images

**Implementation:**
- Dynamic generation in Next.js: `generateMetadata()` in page.tsx files
- Reusable function: `generateOGTags(content: ContentType, type: 'product' | 'project' | 'article')`
- Component: `<SocialShareButtons url={url} title={title} />`
- Share URLs: Use native Web Share API (mobile) + fallback to popups (desktop)

---

### 2. WhatsApp Order Button

**WhatsApp Business Integration:**

**Configuration (Admin Settings):**
- WhatsApp Business Phone Number: `+256 XXX XXX XXXX`
- Business Name: "Revamp UG"
- Default message prefix: "Hello Revamp UG, "

**Button Placement:**
- Product Card: "Message on WhatsApp" button (secondary CTA)
- Product Detail: "Ask About Price" / "Discuss Options" (green WhatsApp button)
- Service Pages: "Book Consultation via WhatsApp"
- Project Gallery: "Inquire About Similar Design"
- Mobile: Prominent button (fixed bottom or inline)
- Desktop: Visible in sidebar or below main CTA

**Pre-filled Message Templates:**

```javascript
// Product
"Hi Revamp UG! I'm interested in [Product Name] - can we discuss pricing and customization options?"

// Project  
"Hi! I love this project: [Project Name] at [Location]. Can I get a consultation to discuss a similar design for my space?"

// Service
"Hello, I'd like to book a consultation for [Service Name]. When are you available?"

// General Inquiry
"Hi Revamp UG! I'm interested in learning more about your services. Can we chat?"
```

**WhatsApp Link Format:**
```
https://wa.me/256XXXXXXXXX?text=[URL-encoded message]
```

**Implementation:**
- Component: `<WhatsAppButton product={product} />`
- Link opens WhatsApp app on mobile, WhatsApp Web on desktop
- Message auto-populated with product/service info
- Track clicks via PostHog for engagement analytics

**Mobile Detection:**
```javascript
const isAndroid = /android/i.test(navigator.userAgent);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isMobile = isAndroid || isIOS;

const whatsappUrl = isMobile 
  ? `https://wa.me/${phoneNumber}?text=${message}`
  : `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

window.open(whatsappUrl, '_blank');
```

---

## Phase 6: AI Search Optimization (Google's Semantic Search Future)

### 1. Structured Data (JSON-LD)

**Product Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Detailed product description",
  "image": "https://...",
  "brand": "Brand Name",
  "offers": {
    "@type": "Offer",
    "price": "Price",
    "priceCurrency": "USD",
    "availability": "InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.5,
    "reviewCount": 20
  }
}
```

**Project Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "Project Name",
  "description": "Project description",
  "image": "https://...",
  "author": {
    "@type": "Person",
    "name": "Designer Name"
  },
  "datePublished": "2024-01-15",
  "about": {
    "@type": "Thing",
    "name": "Interior Design"
  }
}
```

**Article Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Article Title",
  "description": "Article excerpt",
  "image": "https://...",
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-16",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  }
}
```

**Organization Schema (Global):**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Revamp UG",
  "image": "https://...",
  "description": "Interior design and architecture",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Address",
    "addressLocality": "Kampala",
    "addressCountry": "UG"
  },
  "telephone": "+256...",
  "url": "https://therevampug.com"
}
```

**Breadcrumb Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://..."},
    {"@type": "ListItem", "position": 2, "name": "Products", "item": "https://..."},
    {"@type": "ListItem", "position": 3, "name": "Product Name"}
  ]
}
```

**Implementation in Next.js:**
```typescript
// lib/schema-generator.ts
export function generateProductSchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    // ... rest of schema
  };
}

// app/products/[id]/page.tsx
export function generateMetadata({ params }) {
  return {
    other: {
      'application/ld+json': JSON.stringify(generateProductSchema(product))
    }
  };
}
```

---

### 2. API Endpoints for AI Crawlers

**Endpoints (Return JSON-LD + raw data):**

**GET /api/search/products**
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Product Name",
      "description": "Detailed description",
      "price": 1000,
      "currency": "USD",
      "image_url": "https://...",
      "category": "Furniture",
      "rating": 4.5,
      "reviews_count": 20,
      "url": "https://therevampug.com/products/prod_123"
    }
  ],
  "total": 150,
  "pagination": {
    "page": 1,
    "limit": 50
  }
}
```

**GET /api/search/projects**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Project Name",
      "location": "Kampala, Uganda",
      "description": "Project description",
      "style": "Modern Minimalist",
      "image_url": "https://...",
      "designer": "Designer Name",
      "published_date": "2024-01-15",
      "url": "https://therevampug.com/projects/proj_123"
    }
  ],
  "total": 45,
  "pagination": {
    "page": 1,
    "limit": 50
  }
}
```

**GET /api/search/articles**
```json
{
  "articles": [
    {
      "id": "article_123",
      "title": "Article Title",
      "excerpt": "Short excerpt",
      "content": "Full article content in plain text or markdown",
      "author": "Author Name",
      "published_date": "2024-01-15",
      "tags": ["design", "trends", "inspiration"],
      "image_url": "https://...",
      "url": "https://therevampug.com/journal/article_123"
    }
  ],
  "total": 120,
  "pagination": {
    "page": 1,
    "limit": 50
  }
}
```

**GET /api/search/services**
```json
{
  "services": [
    {
      "id": "svc_123",
      "name": "Interior Design",
      "description": "Service description",
      "pricing": {
        "type": "quote",
        "starting_price": 5000,
        "currency": "USD"
      },
      "includes": ["Consultation", "Design Proposal", "3D Visualization"],
      "url": "https://therevampug.com/services/interior-design"
    }
  ]
}
```

**Query Parameters (All endpoints):**
- `page=1` - Pagination
- `limit=50` - Results per page (max 100)
- `category=furniture` - Filter by category
- `sort=newest` - Sort by (newest, popular, rating)
- `format=json-ld` - Return JSON-LD format instead of raw JSON

**Implementation (Next.js Route Handler):**
```typescript
// app/api/search/products/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const category = searchParams.get('category');
  
  let query = db.select().from(products).where(eq(products.status, 'published'));
  
  if (category) {
    query = query.where(eq(products.category, category));
  }
  
  const products = await query
    .limit(Math.min(limit, 100))
    .offset((page - 1) * limit);
  
  return Response.json({
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency,
      image_url: p.image_url,
      category: p.category,
      rating: p.rating,
      reviews_count: p.reviews_count,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${p.slug}`
    })),
    total: await countProducts(category),
    pagination: { page, limit }
  });
}
```

---

### 3. Semantic HTML & SEO Optimization

**Semantic HTML5 Structure:**
```html
<article>
  <header>
    <h1>Product/Project Title</h1>
    <p class="meta">By <span>Author</span> on <time>Date</time></p>
  </header>
  
  <section>
    <h2>Key Features</h2>
    <ul>
      <li>Feature 1</li>
      <li>Feature 2</li>
    </ul>
  </section>
  
  <section>
    <h2>Detailed Description</h2>
    <p>Rich, keyword-optimized description...</p>
  </section>
  
  <section>
    <h2>FAQ</h2>
    <details>
      <summary>Common Question?</summary>
      <p>Answer with relevant keywords...</p>
    </details>
  </section>
  
  <footer>
    <a rel="author" href="...">Author Profile</a>
  </footer>
</article>
```

**Alt Text for All Images:**
```html
<!-- Good -->
<img src="minimalist-living-room.jpg" alt="Modern minimalist living room with white sofa and wooden accent wall" />

<!-- Good (auto-generated from context) -->
<img src="product.jpg" alt="Handcrafted mahogany dining table with leaf extension, seats 8-10" />
```

**Metadata Requirements:**
- Meta title: 50-60 characters (unique per page)
- Meta description: 150-160 characters (compelling, keyword-rich)
- Canonical URL: Always set (prevent duplicates)
- Open Graph tags: All pages (for social sharing)
- Robots: `index, follow` (allow all crawlers)

**Implementation (Next.js):**
```typescript
export const generateMetadata = ({ params }): Metadata => ({
  title: 'Product Name - Revamp UG',
  description: 'Detailed product description under 160 characters...',
  openGraph: {
    title: 'Product Name',
    description: '...',
    images: [{ url: imageUrl, width: 1200, height: 630 }]
  },
  twitter: {
    card: 'summary_large_image',
    title: '...',
    description: '...',
    images: [imageUrl]
  }
});
```

---

### 4. Sitemap & Robots Configuration

**sitemap.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Products (highest priority for AI) -->
  <url>
    <loc>https://therevampug.com/products/prod_123</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
    <lastmod>2024-01-15</lastmod>
  </url>
  
  <!-- Projects (high priority) -->
  <url>
    <loc>https://therevampug.com/projects/proj_123</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>2024-01-10</lastmod>
  </url>
  
  <!-- Articles (medium priority) -->
  <url>
    <loc>https://therevampug.com/journal/article_123</loc>
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
    <lastmod>2024-01-14</lastmod>
  </url>
  
  <!-- Pages (lower priority) -->
  <url>
    <loc>https://therevampug.com/services</loc>
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
  </url>
</urlset>
```

**robots.txt:**
```
User-agent: *
Allow: /
Allow: /api/search/*

Disallow: /admin
Disallow: /api/admin
Disallow: /account/*
Disallow: /*.json

Sitemap: https://therevampug.com/sitemap.xml
```

---

### 5. Core Web Vitals Optimization

**Target Metrics:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB (Time to First Byte): < 600ms

**Optimizations:**
- Image optimization: WebP format, lazy loading, responsive srcset
- Code splitting: Dynamic imports for heavy components
- Caching: ISR (Incremental Static Regeneration) for products/projects
- CDN: Cloudinary for images, Vercel for Next.js
- Compression: Gzip enabled, minification

**Image Optimization:**
```typescript
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={1200}
  height={800}
  quality={85}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurData}
/>
```

---

## Implementation Priority

**Phase 5 (Weeks 1-2):**
1. Social share buttons on products, projects, blogs ✓
2. Dynamic OpenGraph & Twitter meta tags ✓
3. WhatsApp order button integration ✓

**Phase 6 (Weeks 3-4):**
1. JSON-LD schema on all pages ✓
2. API endpoints for AI crawlers ✓
3. Semantic HTML structure ✓
4. Sitemap & robots.txt ✓
5. Core Web Vitals optimization ✓

---

## Testing Checklist

**Social Sharing:**
- [ ] Share preview on Facebook, Twitter, LinkedIn, Pinterest
- [ ] WhatsApp opens and pre-fills message correctly
- [ ] Mobile/desktop behavior correct

**AI Optimization:**
- [ ] JSON-LD validates on schema.org validator
- [ ] API endpoints return valid JSON
- [ ] Core Web Vitals score > 90
- [ ] Google Search Console shows no index errors
- [ ] Sitemap submitted and indexed
- [ ] OpenGraph preview renders correctly in social platforms

**SEO:**
- [ ] Meta titles and descriptions optimized
- [ ] All images have descriptive alt text
- [ ] Internal linking strategy in place
- [ ] Breadcrumbs working
- [ ] No duplicate content issues
