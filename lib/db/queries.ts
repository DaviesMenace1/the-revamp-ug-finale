import { db } from './client';
import { users, products, projects, orders, consultations, articles } from './schema';
import { eq, desc, and, ilike } from 'drizzle-orm';

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

export async function getProjects(limit = 10, offset = 0) {
  return await db.query.projects.findMany({
    limit,
    offset,
    orderBy: desc(projects.createdAt),
  });
}

export async function getProjectById(id: string) {
  return await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}

export async function getProjectsByType(type: string) {
  return await db.query.projects.findMany({
    where: eq(projects.type, type),
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

export async function getOrdersByStatus(status: string) {
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
