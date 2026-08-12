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
  return await db.query.products.findMany({
    limit,
    offset,
    orderBy: desc(products.createdAt),
  });
}

// Fetch single product by slug with relational images and variants
export async function getProductBySlug(slug: string) {
  return await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      variants: true,
      productImages: {
        with: {
          colorVariant: true,
        },
      },
    },
  });
}

// Fetch single product by ID with full variant relations
export async function getProductWithDetails(id: string) {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: true,
      productImages: true,
    },
  });
}

export async function getProductById(id: string) {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
  });
}

export async function getProductsByCategory(category: string) {
  return await db.query.products.findMany({
    where: eq(products.category, category),
    orderBy: desc(products.createdAt),
  });
}

export async function searchProducts(searchTerm: string) {
  return await db.query.products.findMany({
    where: ilike(products.name, `%${searchTerm}%`),
    orderBy: desc(products.createdAt),
  });
}

// ============================================================================
// PROJECTS
// ============================================================================

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
    console.error('Database column mismatch or connection error in getProjects:', error);
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


export async function getProjectsByStatus(status: ProjectStatus) {
  return await db.query.projects.findMany({
    where: eq(projects.status, status),
    orderBy: desc(projects.createdAt),
  });
}

export async function getProjectsByCategory(category: string) {
  return await db.query.projects.findMany({
    where: eq(projects.category, category),
    orderBy: desc(projects.createdAt),
  });
}

// ============================================================================
// ORDERS
// ============================================================================

export async function getOrderById(id: string) {
  return await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });
}

export async function getUserOrders(userId: string) {
  return await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: desc(orders.createdAt),
  });
}

export async function getOrdersByStatus(status: OrderStatus) {
  return await db.query.orders.findMany({
    where: eq(orders.status, status),
    orderBy: desc(orders.createdAt),
  });
}

// ============================================================================
// CONSULTATIONS
// ============================================================================

export async function getConsultationById(id: string) {
  return await db.query.consultations.findFirst({
    where: eq(consultations.id, id),
  });
}

export async function getUserConsultations(userId: string) {
  return await db.query.consultations.findMany({
    where: eq(consultations.userId, userId),
    orderBy: desc(consultations.createdAt),
  });
}

// ============================================================================
// ARTICLES
// ============================================================================

export async function getArticles(limit = 10, offset = 0) {
  return await db.query.articles.findMany({
    limit,
    offset,
    orderBy: desc(articles.publishedAt),
  });
}

export async function getArticleById(id: string) {
  return await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });
}

export async function getArticlesByCategory(category: string) {
  return await db.query.articles.findMany({
    where: eq(articles.category, category),
    orderBy: desc(articles.publishedAt),
  });
}
