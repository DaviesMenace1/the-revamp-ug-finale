# THE REVAMP UG — INFORMATION ARCHITECTURE IMPLEMENTATION PLAN

## Overview
This document outlines the strategic implementation of the comprehensive IA overhaul for The Revamp UG website, transforming it from a furniture e-commerce site into a full luxury design house platform with editorial content, multiple service offerings, and enterprise-level CMS capabilities.

---

## Phase 1: Navigation & Route Structure (PRIORITY)

### Current Navigation
```
- Collections
- Services
- Custom Services
- Portfolio
- About
- Journal
```

### Target Navigation (11 Primary Items)
```
1. Home
2. About
3. Services (with mega menu dropdown)
4. Projects (replaces Portfolio)
5. Shop (replaces Collections)
6. Journal (Blog)
7. Source With Revamp (Procurement)
8. Trade Program
9. Membership
10. Contact
11. Client Portal
```

### Implementation Tasks

#### 1.1 Update Primary Navigation
- File: `/components/site-header.tsx`
- Add mega menu system for Services dropdown
- Update nav items to match 11-item structure
- Add SEO schema markup for navigation

#### 1.2 Create Route Structure
```
/                                 # Home
/about                           # About
/services                        # Services Hub
  /services/interior-design      # Interior Design Services
  /services/architecture         # Architecture Services
  /services/3d-visualization     # 3D Design & Visualization
  /services/renovation           # Renovation & Construction
  /services/procurement          # Procurement & Global Sourcing
  /services/furniture            # Furniture & Custom Manufacturing
  /services/styling              # Styling & Luxury Living
  /services/consultancy          # Consultancy
  /services/property             # Property & Developer Services
  /services/project-management   # Project Management
  /services/signature-services   # Premium Signature Services

/projects                        # Projects Hub
  /projects/[slug]              # Individual Project
  /projects?category=residential
  /projects?category=commercial
  /projects?category=hospitality
  /projects?category=developer
  /projects?category=renovations
  /projects?category=custom-manufacturing
  /projects?category=architecture

/shop                           # Shop Hub
  /shop/[category]              # Category Pages
  /shop/[category]/[subcategory]
  /shop/[product-slug]          # Product Detail

/journal                        # Blog Hub
  /journal/[slug]               # Article Detail
  /journal?category=interior-design
  /journal?category=architecture

/source-with-revamp             # Procurement Hub
/trade                          # Trade Program (existing)
/membership                     # Membership (existing)
/contact                        # Contact
/client-portal                  # Client Portal (existing)

/admin                          # Admin Dashboard
  /admin/products
  /admin/projects
  /admin/articles
  /admin/services               # NEW
  /admin/categories
  /admin/settings
```

---

## Phase 2: Database Schema Enhancements

### Required Additions

#### 2.1 Services Table
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Interior Design, Architecture, etc.
  subcategories JSONB DEFAULT [], -- Array of sub-services
  icon TEXT, -- SVG or icon URL
  featured_image TEXT,
  gallery JSONB DEFAULT [],
  overview_text TEXT,
  featured_toggle BOOLEAN DEFAULT false,
  seo_title VARCHAR(255),
  seo_description VARCHAR(255),
  og_image TEXT,
  related_services JSONB DEFAULT [],
  related_projects JSONB DEFAULT [],
  related_articles JSONB DEFAULT [],
  pricing_notes TEXT,
  process_steps JSONB DEFAULT [], -- Array of steps with descriptions
  include_faq BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'published',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  published_at TIMESTAMP,
  
  CONSTRAINT services_slug_unique UNIQUE(slug),
  INDEX services_category_idx (category),
  INDEX services_status_idx (status)
);
```

#### 2.2 Enhanced Products Table (Add Fields)
```sql
ALTER TABLE products ADD COLUMN (
  og_image TEXT,
  gallery JSONB DEFAULT [], -- Multiple images
  related_products JSONB DEFAULT [],
  material_details JSONB, -- { material, finish, care }
  dimensions JSONB, -- { height, width, depth, unit }
  in_stock BOOLEAN DEFAULT true,
  ready_stock_toggle BOOLEAN DEFAULT false,
  preorder_toggle BOOLEAN DEFAULT false,
  featured_toggle BOOLEAN DEFAULT false,
  new_arrival_toggle BOOLEAN DEFAULT false,
  breadcrumbs JSONB -- Auto-generated breadcrumb trail
);
```

#### 2.3 Enhanced Projects Table (Add Fields)
```sql
ALTER TABLE projects ADD COLUMN (
  project_category VARCHAR(100), -- Residential, Commercial, etc.
  project_type VARCHAR(100), -- Luxury Villas, Apartments, etc.
  subcategory VARCHAR(100),
  before_after BOOLEAN DEFAULT false, -- For renovation projects
  og_image TEXT,
  gallery JSONB DEFAULT [],
  related_projects JSONB DEFAULT [],
  related_articles JSONB DEFAULT [],
  related_services JSONB DEFAULT [],
  breadcrumbs JSONB,
  featured_toggle BOOLEAN DEFAULT false,
  new_project_toggle BOOLEAN DEFAULT false,
  team_members JSONB, -- Array of designer/architect names
  completion_year VARCHAR(4),
  featured_media_type VARCHAR(50) -- 'video', 'image', '3d-tour'
);
```

#### 2.4 Enhanced Articles Table (Add Fields)
```sql
ALTER TABLE articles ADD COLUMN (
  subcategory VARCHAR(100),
  og_image TEXT,
  reading_time INTEGER, -- Calculated minutes
  related_articles JSONB DEFAULT [],
  related_projects JSONB DEFAULT [],
  related_services JSONB DEFAULT [],
  related_products JSONB DEFAULT [],
  breadcrumbs JSONB,
  featured_toggle BOOLEAN DEFAULT false,
  new_article_toggle BOOLEAN DEFAULT false,
  content_type VARCHAR(50), -- 'guide', 'interview', 'inspiration', 'news'
  allow_comments BOOLEAN DEFAULT true
);
```

#### 2.5 Categories Table (Refactored)
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_type VARCHAR(50) NOT NULL, -- 'product', 'project', 'article', 'service'
  parent_id UUID REFERENCES categories(id),
  description TEXT,
  icon TEXT,
  image TEXT,
  seo_title VARCHAR(255),
  seo_description VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT categories_slug_unique UNIQUE(slug),
  INDEX categories_type_idx (category_type),
  INDEX categories_parent_idx (parent_id)
);
```

#### 2.6 FAQ Table
```sql
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100), -- General, Interior Design, Architecture, etc.
  related_service_id UUID,
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'published',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  INDEX faqs_category_idx (category)
);
```

---

## Phase 3: CMS Enhancements

### Required Functionality for All Content Types

Every Product, Project, Blog Article, and Service must support:

- ✅ Slug (URL-friendly identifier)
- ✅ SEO Title
- ✅ Meta Description
- ✅ OG Image (for social sharing)
- ✅ Featured Image / Gallery
- ✅ Rich Text Content
- ✅ Categories & Subcategories
- ✅ Tags
- ✅ Featured Toggle (Hero section display)
- ✅ New Arrival / New Project Toggle
- ✅ Related Items (auto-suggestions)
- ✅ Status (Draft/Published)
- ✅ Author
- ✅ Publish Date
- ✅ Breadcrumb Navigation
- ✅ Search Index Integration
- ✅ Filtering System

### Admin Pages to Create/Update

#### 3.1 Admin Services Manager (`/admin/services`)
- CRUD interface for services
- Sub-service management
- Process step builder
- FAQ management per service
- Related content linking
- Featured services dashboard

#### 3.2 Admin Projects Refactor
- Update to support new project categories
- Rename portfolio → projects
- Add before/after toggle
- Add year/completion date
- Team member assignment

#### 3.3 Admin Articles Refactor
- Add article type (guide, interview, inspiration, news)
- Reading time calculation
- Content outline builder
- Related content suggestions

#### 3.4 Admin Products Refactor
- Gallery management enhancement
- Ready-stock vs Preorder toggle
- Material details JSON editor
- Related products suggestions

#### 3.5 Global FAQ Manager (`/admin/faqs`)
- CRUD for FAQ items
- Category-based organization
- Service-specific FAQs
- Sort order management

---

## Phase 4: Page Templates & Components

### Landing Pages to Create

#### 4.1 Services Hub (`/services`)
- Overview of all 11 service categories
- Grid/card layout with service highlights
- Featured services showcase
- Call-to-action buttons per service

#### 4.2 Individual Service Pages (`/services/[slug]`)
- Hero section with service overview
- Process breakdown (step-by-step)
- Related projects showcase
- Related blog articles
- FAQ section
- Related services
- Call-to-action (Book Consultation)
- Schema markup (BreadcrumbList, Service, FAQPage)

#### 4.3 Projects Hub (`/projects`)
- Grid layout with filtering
- Filter by: Category, Type, Year, Designer
- Featured projects highlighted
- Related articles section
- Search functionality
- Pagination

#### 4.4 Project Detail (`/projects/[slug]`)
- Hero with main project image
- Project overview (client, location, budget, designer, year)
- Process timeline
- Before/after slider (if renovation)
- Full gallery
- Related projects
- Related services
- Related articles
- Client testimonial (if available)
- Schema markup

#### 4.5 Shop Category Pages (`/shop/[category]`)
- Category hero section
- Subcategory navigation
- Product grid with filters
- Sidebar filters (price, material, color)
- Sort options
- Pagination

#### 4.6 Journal Hub (`/journal`)
- Blog grid/list layout
- Featured articles
- Filter by category
- Search
- Author info
- Reading time display
- Related articles

#### 4.7 Source With Revamp (`/source-with-revamp`)
- Procurement service page
- Global sourcing explanation
- Process breakdown
- Services offered
- Case studies/examples
- Call-to-action
- FAQ

---

## Phase 5: SEO & AEO Optimization

### On-Page SEO Requirements

All pages must include:
- ✅ Dynamic meta tags (title, description)
- ✅ Open Graph tags (og:title, og:description, og:image, og:url)
- ✅ Twitter card tags
- ✅ Canonical URLs
- ✅ Structured data (Schema.org):
  - BreadcrumbList
  - Article/NewsArticle
  - Product
  - LocalBusiness
  - Organization
  - FAQPage
  - Service
  - BreadcrumbList
- ✅ Sitemap (dynamic generation)
- ✅ robots.txt with crawl directives
- ✅ Hreflang tags (if multi-language)

### Technical SEO

- ✅ Mobile-responsive design
- ✅ Fast page load (Core Web Vitals optimization)
- ✅ Clean URL structure
- ✅ XML sitemap auto-generation
- ✅ 301 redirects for old URLs
- ✅ Internal linking strategy
- ✅ Schema markup for all content types
- ✅ Image optimization with alt text

### AEO (AI Engine Optimization) for AI Search Engines

- ✅ Clear, structured content hierarchy
- ✅ Semantic HTML markup
- ✅ Rich contextual information
- ✅ FAQ schema for common questions
- ✅ Clear definitions and explanations
- ✅ Entity relationships documented
- ✅ Author expertise signals
- ✅ E-E-A-T signals (Expertise, Experience, Authoritativeness, Trustworthiness)
- ✅ Microdata for entities, services, projects
- ✅ Knowledge graph optimization
- ✅ Clear navigation structure

### Implementation Files to Create

#### 5.1 SEO Utilities (`/lib/seo/metadata.ts`)
- Dynamic meta tag generation
- Schema.org markup helpers
- Sitemap generation
- robots.txt generation
- Breadcrumb generation

#### 5.2 SEO Components (`/components/seo/`)
- SchemaMarkup component
- MetaTags component
- StructuredData component
- Breadcrumbs component

---

## Phase 6: Search & Filtering System

### Unified Search Implementation

- ✅ Global search across Products, Projects, Articles, Services
- ✅ Fuzzy search capabilities
- ✅ Search as you type
- ✅ Search result ranking by relevance
- ✅ Filters: Type, Category, Date, Price, etc.
- ✅ Search analytics tracking

### Filtering System

- ✅ Multi-select filters
- ✅ Price range sliders
- ✅ Date filters
- ✅ Category filters
- ✅ Tag filters
- ✅ "Clear all filters" button
- ✅ Filter state in URL (for sharing)

---

## Phase 7: Performance & Caching

### Optimization Strategy

- ✅ ISR (Incremental Static Regeneration) for products/projects
- ✅ Image optimization with Next.js Image component
- ✅ Lazy loading for galleries
- ✅ Code splitting by route
- ✅ Database query optimization
- ✅ Redis caching for hot data
- ✅ CDN distribution

---

## Implementation Priority Timeline

### Week 1: Foundation
- [ ] Update navigation structure (site-header.tsx)
- [ ] Create services table + admin interface
- [ ] Create services hub and detail pages

### Week 2: Content Enhancement
- [ ] Enhance products table + refactor admin
- [ ] Enhance projects table + refactor admin
- [ ] Create projects hub and detail pages

### Week 3: Blog & Articles
- [ ] Enhance articles table
- [ ] Create journal hub enhancements
- [ ] Implement reading time calculation

### Week 4: SEO & AEO
- [ ] Implement comprehensive Schema markup
- [ ] Add meta tag generation
- [ ] Create breadcrumb system
- [ ] robots.txt and sitemap generation

### Week 5: Search & Filtering
- [ ] Implement global search
- [ ] Advanced filtering system
- [ ] Search result ranking

### Week 6: Polish & Deploy
- [ ] Performance optimization
- [ ] Testing and QA
- [ ] Production deployment

---

## File Structure Overview

```
/app
  /services
    /page.tsx (Services Hub)
    /[slug]
      /page.tsx (Individual Service)
  /projects
    /page.tsx (Projects Hub)
    /[slug]
      /page.tsx (Project Detail)
  /admin
    /services
      /page.tsx (Service Management)
    /projects
      /page.tsx (Enhanced Project Management)
    /articles
      /page.tsx (Enhanced Article Management)
    /faqs
      /page.tsx (FAQ Management)

/components
  /seo
    /metadata.ts
    /schema-markup.tsx
    /breadcrumbs.tsx
  /services
    /service-card.tsx
    /service-detail.tsx
    /service-grid.tsx
  /projects
    /project-card.tsx
    /project-detail.tsx
    /project-grid.tsx

/lib
  /seo
    /metadata.ts
    /schema.ts
    /sitemap.ts
  /db
    /schema.ts (Updated with new tables)
```

---

## Success Metrics

- SEO ranking improvements for target keywords
- AI search engine indexing completeness
- User engagement metrics (time on site, bounce rate)
- Conversion rate improvements
- Search traffic increase
- Mobile Core Web Vitals scores (>90)

---

## Notes

1. **Backward Compatibility**: All existing routes should continue to work with 301 redirects
2. **Migration**: Existing content (products, projects, blogs) should be migrated to new structure
3. **Testing**: Comprehensive testing across all browsers and devices
4. **Performance**: Continuous monitoring of Core Web Vitals and performance metrics
5. **Accessibility**: WCAG 2.1 AA compliance for all new pages
