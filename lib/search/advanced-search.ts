/**
 * Advanced Search and Filtering System
 * Provides comprehensive search and filter capabilities across products, projects, and articles
 */

export interface SearchFilters {
  query?: string
  category?: string
  subcategory?: string
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  status?: string
  featured?: boolean
  sortBy?: 'relevance' | 'newest' | 'popular' | 'price-low' | 'price-high' | 'rating'
  page?: number
  limit?: number
}

export interface SearchResult {
  id: string
  type: 'product' | 'project' | 'article' | 'service'
  title: string
  slug: string
  description: string
  image?: string
  url: string
  score?: number
}

/**
 * Full-text search with relevance scoring
 */
export function fullTextSearch(
  items: any[],
  query: string,
  searchFields: string[]
): SearchResult[] {
  if (!query || query.trim().length === 0) return []

  const searchTerms = query.toLowerCase().split(/\s+/)

  return items
    .map((item) => {
      let score = 0

      // Calculate relevance score
      searchFields.forEach((field) => {
        const value = getNestedProperty(item, field)?.toString().toLowerCase() || ''

        searchTerms.forEach((term) => {
          // Exact match gets highest score
          if (value === term) score += 100
          // Field starts with term
          else if (value.startsWith(term)) score += 50
          // Term appears in field
          else if (value.includes(term)) score += 25
          // Fuzzy match
          else if (fuzzyMatch(value, term)) score += 10
        })
      })

      return { ...item, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Filter items based on multiple criteria
 */
export function filterItems(items: any[], filters: SearchFilters): any[] {
  return items.filter((item) => {
    // Category filter
    if (filters.category && item.category !== filters.category) return false

    // Subcategory filter
    if (filters.subcategory && item.subCategory !== filters.subcategory) return false

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const itemTags = item.tags || []
      const hasMatchingTag = filters.tags.some((tag) => itemTags.includes(tag))
      if (!hasMatchingTag) return false
    }

    // Price range filter
    if (filters.minPrice !== undefined && item.price < filters.minPrice) return false
    if (filters.maxPrice !== undefined && item.price > filters.maxPrice) return false

    // Status filter
    if (filters.status && item.status !== filters.status) return false

    // Featured filter
    if (filters.featured === true && !item.featured) return false

    return true
  })
}

/**
 * Sort items based on criteria
 */
export function sortItems(
  items: any[],
  sortBy: SearchFilters['sortBy'] = 'relevance'
): any[] {
  const sorted = [...items]

  switch (sortBy) {
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    case 'popular':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0))

    case 'price-low':
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))

    case 'price-high':
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))

    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    case 'relevance':
    default:
      return sorted.sort((a, b) => (b.score || 0) - (a.score || 0))
  }
}

/**
 * Pagination
 */
export function paginate<T>(items: T[], page: number = 1, limit: number = 20): T[] {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

/**
 * Execute advanced search with filters, sorting, and pagination
 */
export function advancedSearch(items: any[], filters: SearchFilters): SearchResult[] {
  let results = items

  // Text search
  if (filters.query) {
    const searchResults = fullTextSearch(items, filters.query, [
      'name',
      'title',
      'description',
      'category',
      'tags',
    ])
    results = searchResults
  }

  // Apply filters
  results = filterItems(results, filters)

  // Sort
  results = sortItems(results, filters.sortBy)

  // Pagination
  if (filters.page && filters.limit) {
    results = paginate(results, filters.page, filters.limit)
  }

  return results
}

/**
 * Get available filter options (for UI)
 */
export function getFilterOptions(items: any[]): {
  categories: string[]
  subcategories: string[]
  tags: string[]
  priceRange: { min: number; max: number }
} {
  const categories = new Set<string>()
  const subcategories = new Set<string>()
  const tags = new Set<string>()
  let minPrice = Infinity
  let maxPrice = 0

  items.forEach((item) => {
    if (item.category) categories.add(item.category)
    if (item.subCategory) subcategories.add(item.subCategory)
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag: string) => tags.add(tag))
    }
    if (item.price) {
      minPrice = Math.min(minPrice, item.price)
      maxPrice = Math.max(maxPrice, item.price)
    }
  })

  return {
    categories: Array.from(categories).sort(),
    subcategories: Array.from(subcategories).sort(),
    tags: Array.from(tags).sort(),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice,
    },
  }
}

/**
 * Suggest search results (for autocomplete)
 */
export function suggestSearchResults(items: any[], query: string, limit: number = 5): string[] {
  if (!query || query.length < 2) return []

  const queryLower = query.toLowerCase()
  const suggestions = new Set<string>()

  items.forEach((item) => {
    const title = item.name || item.title || ''
    if (title.toLowerCase().includes(queryLower) && suggestions.size < limit) {
      suggestions.add(title)
    }

    if (item.category && item.category.toLowerCase().includes(queryLower)) {
      suggestions.add(item.category)
    }

    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes(queryLower) && suggestions.size < limit) {
          suggestions.add(tag)
        }
      })
    }
  })

  return Array.from(suggestions).slice(0, limit)
}

/**
 * Helper: Get nested property from object
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj)
}

/**
 * Helper: Fuzzy string matching
 */
function fuzzyMatch(str: string, pattern: string): boolean {
  const patternArray = pattern.split('')
  let patternIndex = 0

  for (let i = 0; i < str.length; i++) {
    if (str[i] === patternArray[patternIndex]) {
      patternIndex++
    }
    if (patternIndex === pattern.length) return true
  }

  return false
}
