import { db } from './client';
import { users, products, projects, orders, consultations, articles, productVariants, productImages } from './schema';
import { eq, desc, ilike, and, ne } from 'drizzle-orm';
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

export async function getProductsByCategory(category: string) {
  try {
    return await db.query.products.findMany({
      where: eq(products.category, category),
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

export async function getProjectBySlug(slug: string) {
  try {
    return await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
    });
  } catch (error) {
    return null;
  }
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
      where: eq(articles.category, category),
      orderBy: desc(articles.publishedAt),
    });
  } catch (error) {
    return [];
  }
}

