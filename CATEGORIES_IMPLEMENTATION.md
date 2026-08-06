# Product Categories Implementation Plan

## Overview
The Revamp UG now has a comprehensive 24-category taxonomy with 200+ subcategories, positioning the business as a complete luxury design and sourcing company.

## Files Created
- `lib/data/categories.ts` - Complete category taxonomy with helper functions

## What You Get

### 1. **Core Categories (24 Main + 200+ Subcategories)**
   - Living Room (21 subcategories)
   - Dining (9 subcategories)
   - Bedroom (13 subcategories)
   - Office (9 subcategories)
   - Outdoor (12 subcategories)
   - Kitchen (8 subcategories)
   - Bathroom (9 subcategories)
   - Lighting (8 subcategories)
   - Decor (11 subcategories)
   - Rugs & Carpets (5 subcategories)
   - Window Treatments (7 subcategories)
   - Art & Wall Decor (6 subcategories)
   - Storage (6 subcategories)
   - Children's Collection (7 subcategories)
   - Hospitality Collection (6 subcategories)
   - Commercial Collection (6 subcategories)
   - Smart Home (6 subcategories)
   - Home Accessories (9 subcategories)
   - Architectural & Interior Finishes (17 subcategories)
   - Hardware (6 subcategories)
   - Appliances (9 subcategories)
   - Wellness & Lifestyle (5 subcategories)
   - Seasonal Collections (5 subcategories)
   - Custom & Made-to-Order (10 subcategories) ← KEY DIFFERENTIATOR

## Implementation Roadmap

### Phase 1: Admin Category Management (Week 1)
- [ ] Create admin page: `/admin/categories`
  - List all 24 main categories
  - Ability to add/edit/delete categories
  - Manage subcategories
  - Drag-to-reorder functionality
  - SEO management (description, seo_title, seo_description)

### Phase 2: Category Pages & Filtering (Week 2)
- [ ] Create public category landing pages
  - Route: `/collections/[category]` (e.g., `/collections/living-room`)
  - Route: `/collections/[category]/[subcategory]` (e.g., `/collections/living-room/sofas`)
  - Category hero section with description
  - Featured products grid
  - Filter sidebar with subcategories
  - Product count per subcategory
  - Related categories carousel

### Phase 3: Product Admin Integration (Week 2)
- [ ] Update admin products page
  - Add category dropdown (main 24)
  - Add subcategory dropdown (dynamic based on main category)
  - Filter products by category/subcategory
  - Bulk category assignment tools

### Phase 4: Homepage & Navigation (Week 3)
- [ ] Update main navigation menu
  - Category menu with hover-reveal subcategories
  - "Shop by Category" mega-menu
  - Quick links to top 5-7 categories

### Phase 5: Search & Filtering (Week 3)
- [ ] Integrate categories into search
  - Filter search results by category
  - Category-specific search endpoints
  - Faceted search/navigation

### Phase 6: Custom Services Integration (Week 4)
- [ ] Create custom services request form
  - Route: `/custom-services` or `/collections/custom-services`
  - Service category selection
  - Request submission with specifications
  - Admin dashboard to manage custom requests
  - Client portal to track custom order status

## Database Changes Needed

### Current Schema (Already Exists)
The `products` table already has `category` and `subCategory` fields. No migration needed, but you may want to:

```sql
-- Optional: Add category constraints for data quality
ALTER TABLE products ADD CONSTRAINT valid_category CHECK (category IN (
  'living-room', 'dining', 'bedroom', 'office', 'outdoor', 'kitchen', 'bathroom', 
  'lighting', 'decor', 'rugs-carpets', 'window-treatments', 'art-wall-decor', 
  'storage', 'childrens', 'hospitality', 'commercial', 'smart-home', 
  'home-accessories', 'architectural-finishes', 'hardware', 'appliances', 
  'wellness', 'seasonal', 'custom-services'
));
```

## Helper Functions Available

In `lib/data/categories.ts`:
```typescript
getCategoryById(id: string) → Category
getCategoryBySlug(slug: string) → Category
getMainCategories() → { id, name, slug }[]
getSubcategories(categoryId: string) → CategoryItem[]
```

## Usage Examples

### In Admin Components
```tsx
import { PRODUCT_CATEGORIES, getSubcategories } from '@/lib/data/categories'

// Get all categories for dropdown
const categories = PRODUCT_CATEGORIES

// Get subcategories for selected category
const subs = getSubcategories(selectedCategoryId)
```

### In Public Pages
```tsx
import { getCategoryBySlug, getMainCategories } from '@/lib/data/categories'

// Get category for page title/meta
const category = getCategoryBySlug('living-room')

// Get all for navigation
const categories = getMainCategories()
```

## Key Features

✓ **Complete Taxonomy** - 24 main + 200+ subcategories
✓ **Custom Services** - Integrated as a category with 10 service types
✓ **Scalable** - Easy to add/remove categories
✓ **Type-Safe** - Full TypeScript interfaces
✓ **SEO-Ready** - Slug-based URLs with descriptions
✓ **Organized** - Hierarchical structure ready for navigation
✓ **Extensible** - Room for icons, images, analytics per category

## Next Steps

1. **Update the admin dashboard** to use these categories
2. **Create category pages** with product filtering
3. **Integrate into navigation menus**
4. **Update product management** to support category assignment
5. **Create custom services section**
6. **Set up product migrations** to assign existing products to correct categories

## Custom Services Workflow

The "Custom & Made-to-Order" category is designed to:
- Allow customers to request custom work across all 10 service types
- Submit project briefs with specifications and budget
- Track custom order status in client portal
- Manage custom requests in admin dashboard
- Integrate with consultation/quoting system

---

**Status**: Taxonomy defined ✓ | Admin integration: Pending | Public pages: Pending | Search integration: Pending
