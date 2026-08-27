import { db } from './client';
import { users, products, projects, orders, consultations, articles, productVariants, productImages, services } from './schema';
import { eq, desc, ilike, and, ne, asc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

type OrderStatus = NonNullable<InferSelectModel<typeof orders>['status']>;
type ProjectStatus = NonNullable<InferSelectModel<typeof projects>['status']>;

// ============================================================================
// PRODUCTS
// ============================================================================

export async function getProducts(limit = 10, offset = 0) {
  try {
    return await db.query.products.findMany({
      limit,
      offset,
      orderBy: desc(products.createdAt),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: {
  productVariants: true,
  productImages: true,
},
    });
  } catch (error) {
    return null;
  }
}

export async function getProductWithDetails(id: string) {
  try {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
  productVariants: true,
  productImages: true,
},
    });
  } catch (error) {
    return null;
  }
}

export async function getProductById(id: string) {
  try {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
    });
  } catch (error) {
    return null;
  }
}

export async function getProductsByCategory(subCategoryId: string) {
  try {
    return await db.query.products.findMany({
      where: eq(products.subCategoryId, subCategoryId),
      orderBy: desc(products.createdAt),
    });
  } catch (error) {
    return [];
  }
}

export async function searchProducts(searchTerm: string) {
  try {
    return await db.query.products.findMany({
      where: ilike(products.name, `%${searchTerm}%`),
      orderBy: desc(products.createdAt),
    });
  } catch (error) {
    return [];
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

const publishedPortfolioFilter = and(eq(projects.projectKind, 'portfolio'), eq(projects.publishStatus, 'published'))

export async function getProjects(limit = 10, offset = 0) {
  try {
    return await db.query.projects.findMany({
      limit,
      offset,
      orderBy: desc(projects.createdAt),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function getProjectById(id: string) {
  try {
    return await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  } catch (error) {
    return null;
  }
}

export async function getPublishedProjectBySlug(slug: string) {
  try {
    return await db.query.projects.findFirst({
      where: and(eq(projects.slug, slug), publishedPortfolioFilter),
    });
  } catch (error) {
    console.error('Error fetching published project:', error)
    return null;
  }
}

export async function getPublishedProjects(limit = 10, offset = 0) {
  try {
    return await db.query.projects.findMany({
      where: publishedPortfolioFilter,
      limit,
      offset,
      orderBy: desc(projects.createdAt),
    });
  } catch (error) {
    console.error('Error fetching published projects:', error)
    return [];
  }
}

export async function getPublishedProjectsByCategory(category: string) {
  try {
    return await db.query.projects.findMany({
      where: and(eq(projects.category, category), publishedPortfolioFilter),
      orderBy: desc(projects.createdAt),
    });
  } catch (error) {
    console.error('Error fetching published projects by category:', error)
    return [];
  }
}

export async function getProjectBySlug(slug: string) {
  return getPublishedProjectBySlug(slug)
}

export async function getProjectsByStatus(status: ProjectStatus) {
  try {
    return await db.query.projects.findMany({
      where: eq(projects.status, status),
      orderBy: desc(projects.createdAt),
    });
  } catch (error) {
    return [];
  }
}

export async function getProjectsByCategory(category: string) {
  try {
    return await db.query.projects.findMany({
      where: eq(projects.category, category),
      orderBy: desc(projects.createdAt),
    });
  } catch (error) {
    return [];
  }
}

// ============================================================================
// ORDERS
// ============================================================================

export async function getOrderById(id: string) {
  try {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });
  } catch (error) {
    return null;
  }
}

export async function getUserOrders(userId: string) {
  try {
    return await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      orderBy: desc(orders.createdAt),
    });
  } catch (error) {
    return [];
  }
}

export async function getOrdersByStatus(status: OrderStatus) {
  try {
    return await db.query.orders.findMany({
      where: eq(orders.status, status),
      orderBy: desc(orders.createdAt),
    });
  } catch (error) {
    return [];
  }
}

// ============================================================================
// CONSULTATIONS
// ============================================================================

export async function getConsultationById(id: string) {
  try {
    return await db.query.consultations.findFirst({
      where: eq(consultations.id, id),
    });
  } catch (error) {
    return null;
  }
}

export async function getUserConsultations(userId: string) {
  try {
    return await db.query.consultations.findMany({
      where: eq(consultations.userId, userId),
      orderBy: desc(consultations.createdAt),
    });
  } catch (error) {
    return [];
  }
}

// ============================================================================
// ARTICLES
// ============================================================================

export async function getPublishedArticles(limit = 10, offset = 0) {
  try {
    return await db.query.articles.findMany({
      where: eq(articles.status, 'published'),
      limit,
      offset,
      orderBy: desc(articles.publishedAt),
    })
  } catch (error) {
    return []
  }
}

export async function getArticles(limit = 10, offset = 0) {
  try {
    return await db.query.articles.findMany({
      limit,
      offset,
      orderBy: desc(articles.publishedAt),
    });
  } catch (error) {
    return [];
  }
}

export async function getArticleById(id: string) {
  try {
    return await db.query.articles.findFirst({
      where: eq(articles.id, id),
    });
  } catch (error) {
    return null;
  }
}

export async function getArticlesByCategory(category: string) {
  try {
    return await db.query.articles.findMany({
      where: and(eq(articles.category, category), eq(articles.status, 'published')),
      orderBy: desc(articles.publishedAt),
    });
  } catch (error) {
    return [];
  }
}

/**
 * Public search index. Each source is bounded and publication-filtered so the
 * search surface cannot resurrect the old static seed data or draft records.
 * Queries are intentionally sequenced because the deployed DB client uses a
 * single transaction-pooler connection per serverless instance.
 */
export async function getPublishedSearchData() {
  const publishedProducts = await db.query.products.findMany({
    where: eq(products.status, 'published'),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      ogImage: true,
    },
    with: {
      productImages: {
        columns: { url: true, isPrimary: true, displayOrder: true },
      },
    },
    orderBy: desc(products.updatedAt),
    limit: 100,
  }).catch((error) => {
    console.error('Error fetching published products for search:', error)
    return []
  })

  const publishedProjects = await db.query.projects.findMany({
    where: publishedPortfolioFilter,
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shortDescription: true,
      category: true,
      location: true,
      year: true,
      thumbnailImage: true,
      ogImage: true,
      images: true,
      gallery: true,
      featured: true,
    },
    orderBy: [desc(projects.featured), desc(projects.updatedAt)],
    limit: 100,
  }).catch((error) => {
    console.error('Error fetching published projects for search:', error)
    return []
  })

  const publishedArticles = await db.query.articles.findMany({
    where: eq(articles.status, 'published'),
    columns: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      featuredImage: true,
      seoDescription: true,
    },
    orderBy: [desc(articles.publishedAt), desc(articles.updatedAt)],
    limit: 100,
  }).catch((error) => {
    console.error('Error fetching published articles for search:', error)
    return []
  })

  const publishedServices = await db.query.services.findMany({
    where: eq(services.status, 'published'),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      ogImage: true,
      categoryId: true,
    },
    with: {
      category: {
        columns: { slug: true, name: true },
      },
    },
    orderBy: [asc(services.order), asc(services.name)],
    limit: 100,
  }).catch((error) => {
    console.error('Error fetching published services for search:', error)
    return []
  })

  return { products: publishedProducts, projects: publishedProjects, articles: publishedArticles, services: publishedServices }
}

