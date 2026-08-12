import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'customer',
  'designer',
  'admin',
  'trade_member',
  'architect',
  'interior_designer',
]);

export const projectStatusEnum = pgEnum('project_status', [
  'consultation_scheduled',
  'design_phase',
  'procurement_phase',
  'installation_phase',
  'completed',
  'on_hold',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const variantTypeEnum = pgEnum('variant_type', ['COLOR', 'FABRIC']);

// Users Table — synced from Clerk via webhook
// clerkId is the Clerk user_id (e.g. "user_2abc123")
// All FK references use this table's id (uuid), not the clerkId
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(), // Clerk user_id
    email: varchar('email', { length: 255 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    country: varchar('country', { length: 100 }),
    city: varchar('city', { length: 100 }),
    company: varchar('company', { length: 255 }),
    role: userRoleEnum('role').default('customer'),
    avatar: text('avatar'), // Cloudinary URL
    bio: text('bio'),
    marketingConsent: boolean('marketing_consent').default(true),
    preferredLanguage: varchar('preferred_language', { length: 5 }).default('en'),
    brevoContactId: varchar('brevo_contact_id', { length: 100 }), // Brevo contact reference
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('email_idx').on(table.email),
    clerkIdx: uniqueIndex('clerk_id_idx').on(table.clerkId),
    roleIdx: index('role_idx').on(table.role),
  })
);

// Products Table
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    //longDescription: text('long_description'),
    category: varchar('category', { length: 100 }).notNull(),
    subCategory: varchar('sub_category', { length: 100 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
    images: jsonb('images').default([]), // Array of Cloudinary URLs
    gallery: jsonb('gallery').default([]), // Additional product gallery images
    thumbnailImage: text('thumbnail_image'), // Cloudinary URL
    inStock: boolean('in_stock').default(true),
    quantity: integer('quantity').default(0),
    sku: varchar('sku', { length: 100 }).unique(),
    dimensions: jsonb('dimensions'), // { length, width, height, unit }
    weight: decimal('weight', { precision: 8, scale: 2 }),
    material: varchar('material', { length: 255 }),
    color: varchar('color', { length: 100 }),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
    ratingCount: integer('rating_count').default(0),
    likes: integer('likes').default(0),
    views: integer('views').default(0),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: varchar('seo_description', { length: 255 }),
    ogImage: text('og_image'), // Cloudinary URL for social sharing
    tags: jsonb('tags').default([]), // Array of tags for filtering/search
    relatedProducts: jsonb('related_products').default([]), // Array of product IDs
    featured: boolean('featured').default(false),
    status: varchar('status', { length: 50 }).default('published'), // published, draft, archived
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    publishedAt: timestamp('published_at'),
  },
  (table) => ({
    categoryIdx: index('category_idx').on(table.category),
    statusIdx: index('status_idx').on(table.status),
    slugIdx: uniqueIndex('slug_idx').on(table.slug),
    featuredIdx: index('product_featured_idx').on(table.featured),
  })
);

// --- Add below your products table ---
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    type: variantTypeEnum('type').notNull(),
    label: varchar('label', { length: 100 }).notNull(), // e.g. "Charcoal", "Bouclé"
    value: varchar('value', { length: 100 }),            // Hex code or swatch value (e.g. "#1C1C1C")
    priceDelta: decimal('price_delta', { precision: 10, scale: 2 }).default('0.00'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    productIdIdx: index('variant_product_idx').on(table.productId),
    typeIdx: index('variant_type_idx').on(table.type),
  })
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    colorId: uuid('color_id').references(() => productVariants.id, { onDelete: 'set null' }),
    url: text('url').notNull(), // Cloudinary URL
    isPrimary: boolean('is_primary').default(false),
    order: integer('order').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    productIdIdx: index('image_product_idx').on(table.productId),
    colorIdIdx: index('image_color_idx').on(table.colorId),
  })
);

// Projects Table
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    longDescription: text('long_description'),
    category: varchar('category', { length: 100 }),
    subCategory: varchar('sub_category', { length: 100 }),
    clientName: varchar('client_name', { length: 255 }),
    location: varchar('location', { length: 255 }),
    budget: decimal('budget', { precision: 12, scale: 2 }),
    images: jsonb('images').default([]), // Array of Cloudinary URLs
    gallery: jsonb('gallery').default([]), // Project gallery for before/after
    thumbnailImage: text('thumbnail_image'), // Cloudinary URL
    designer: varchar('designer', { length: 255 }),
    status: projectStatusEnum('status').default('consultation_scheduled'),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
    ratingCount: integer('rating_count').default(0),
    likes: integer('likes').default(0),
    views: integer('views').default(0),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: varchar('seo_description', { length: 255 }),
    ogImage: text('og_image'), // Cloudinary URL for social sharing
    tags: jsonb('tags').default([]), // Array of tags
    relatedProjects: jsonb('related_projects').default([]), // Array of project IDs
    featured: boolean('featured').default(false),
    publishStatus: varchar('publish_status', { length: 50 }).default('published'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    publishedAt: timestamp('published_at'),
  },
  (table) => ({
    categoryIdx: index('project_category_idx').on(table.category),
    statusIdx: index('project_status_idx').on(table.status),
    slugIdx: uniqueIndex('project_slug_idx').on(table.slug),
    featuredIdx: index('project_featured_idx').on(table.featured),
  })
);

// Blog/Articles Table
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    content: text('content').notNull(),
    excerpt: varchar('excerpt', { length: 500 }),
    author: varchar('author', { length: 255 }),
    category: varchar('category', { length: 100 }),
    subCategory: varchar('sub_category', { length: 100 }),
    tags: jsonb('tags').default([]), // Array of tag strings
    featuredImage: text('featured_image'), // Cloudinary URL
    gallery: jsonb('gallery').default([]), // Article gallery for hero and content images
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
    ratingCount: integer('rating_count').default(0),
    likes: integer('likes').default(0),
    views: integer('views').default(0),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: varchar('seo_description', { length: 255 }),
    ogImage: text('og_image'), // Cloudinary URL for social sharing
    relatedArticles: jsonb('related_articles').default([]), // Array of article IDs
    featured: boolean('featured').default(false),
    status: varchar('status', { length: 50 }).default('published'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    publishedAt: timestamp('published_at'),
  },
  (table) => ({
    categoryIdx: index('article_category_idx').on(table.category),
    statusIdx: index('article_status_idx').on(table.status),
    slugIdx: uniqueIndex('article_slug_idx').on(table.slug),
    featuredIdx: index('article_featured_idx').on(table.featured),
  })
);

// Cart Table - stores user's shopping cart
export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    items: jsonb('items').default([]), // Array of { productId, quantity, price, name, image }
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('cart_user_idx').on(table.userId),
  })
);

// Orders Table
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    userId: uuid('user_id').notNull(),
    items: jsonb('items').default([]), // Array of { productId, quantity, price }
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    tax: decimal('tax', { precision: 12, scale: 2 }).default('0'),
    shipping: decimal('shipping', { precision: 12, scale: 2 }).default('0'),
    discount: decimal('discount', { precision: 12, scale: 2 }).default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    status: orderStatusEnum('status').default('pending'),
    paymentStatus: paymentStatusEnum('payment_status').default('pending'),
    deliveryAddress: jsonb('delivery_address'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('order_user_idx').on(table.userId),
    statusIdx: index('order_status_idx').on(table.status),
    orderNumberIdx: uniqueIndex('order_number_idx').on(table.orderNumber),
  })
);

// Consultations Table
export const consultations = pgTable(
  'consultations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    serviceType: varchar('service_type', { length: 100 }),
    budget: decimal('budget', { precision: 12, scale: 2 }),
    preferredDate: timestamp('preferred_date'),
    status: varchar('status', { length: 50 }).default('pending'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('consultation_user_idx').on(table.userId),
    statusIdx: index('consultation_status_idx').on(table.status),
  })
);

// Quotes/Quotations Table
export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteNumber: varchar('quote_number', { length: 50 }).notNull().unique(),
    userId: uuid('user_id').notNull(),
    consultationId: uuid('consultation_id'),
    items: jsonb('items').default([]), // Array of quote items
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    tax: decimal('tax', { precision: 12, scale: 2 }).default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    validUntil: timestamp('valid_until'),
    status: varchar('status', { length: 50 }).default('pending'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('quote_user_idx').on(table.userId),
    statusIdx: index('quote_status_idx').on(table.status),
  })
);

// Comments/Reviews Table
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    productId: uuid('product_id'),
    projectId: uuid('project_id'),
    articleId: uuid('article_id'),
    content: text('content').notNull(),
    rating: integer('rating'),
    approved: boolean('approved').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('comment_user_idx').on(table.userId),
    productIdIdx: index('comment_product_idx').on(table.productId),
    projectIdIdx: index('comment_project_idx').on(table.projectId),
    articleIdIdx: index('comment_article_idx').on(table.articleId),
  })
);

// Likes Table
export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    productId: uuid('product_id'),
    projectId: uuid('project_id'),
    articleId: uuid('article_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('like_user_idx').on(table.userId),
    productIdIdx: index('like_product_idx').on(table.productId),
    projectIdIdx: index('like_project_idx').on(table.projectId),
    articleIdIdx: index('like_article_idx').on(table.articleId),
    userProductUnique: uniqueIndex('user_product_unique').on(table.userId, table.productId),
    userProjectUnique: uniqueIndex('user_project_unique').on(table.userId, table.projectId),
    userArticleUnique: uniqueIndex('user_article_unique').on(table.userId, table.articleId),
  })
);

// Trade Members Table
export const tradeMembers = pgTable(
  'trade_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    businessName: varchar('business_name', { length: 255 }).notNull(),
    businessCategory: varchar('business_category', { length: 100 }),
    tradeType: varchar('trade_type', { length: 100 }), // architect, designer, developer, etc.
    taxNumber: varchar('tax_number', { length: 50 }),
    businessLicense: text('business_license'), // AWS S3 URL
    certificate: text('certificate'), // AWS S3 URL
    status: varchar('status', { length: 50 }).default('pending'), // pending, approved, rejected, suspended
    appliedAt: timestamp('applied_at').notNull().defaultNow(),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('trade_member_user_idx').on(table.userId),
    statusIdx: index('trade_member_status_idx').on(table.status),
  })
);

// Membership Table
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    membershipType: varchar('membership_type', { length: 50 }).notNull(), // essential, collector, patron, black
    status: varchar('status', { length: 50 }).default('active'),
    startDate: timestamp('start_date').notNull().defaultNow(),
    endDate: timestamp('end_date'),
    benefits: jsonb('benefits').default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('membership_user_idx').on(table.userId),
    typeIdx: index('membership_type_idx').on(table.membershipType),
  })
);

// Services Categories Table
export const serviceCategories = pgTable(
  'service_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }), // lucide icon name
    image: text('image'), // Cloudinary URL
    order: integer('order').default(0),
    featured: boolean('featured').default(false),
    status: varchar('status', { length: 50 }).default('published'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('service_category_slug_idx').on(table.slug),
    statusIdx: index('service_category_status_idx').on(table.status),
    orderIdx: index('service_category_order_idx').on(table.order),
  })
);

// Services Table
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id').notNull().references(() => serviceCategories.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    longDescription: text('long_description'),
    icon: varchar('icon', { length: 100 }), // lucide icon name
    image: text('image'), // Cloudinary URL
    gallery: jsonb('gallery').default([]), // Array of Cloudinary URLs
    order: integer('order').default(0),
    featured: boolean('featured').default(false),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: varchar('seo_description', { length: 255 }),
    ogImage: text('og_image'), // Cloudinary URL
    status: varchar('status', { length: 50 }).default('published'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdIdx: index('service_category_id_idx').on(table.categoryId),
    slugIdx: uniqueIndex('service_slug_idx').on(table.slug),
    statusIdx: index('service_status_idx').on(table.status),
    orderIdx: index('service_order_idx').on(table.order),
  })
);

// Service Requests Table (for custom service requests)
export const serviceRequests = pgTable(
  'service_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    serviceId: uuid('service_id').references(() => services.id),
    serviceType: varchar('service_type', { length: 100 }).notNull(), // furniture, upholstery, cabinetry, lighting, styling, other
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    company: varchar('company', { length: 255 }),
    budget: varchar('budget', { length: 100 }), // Range like "10k-25k"
    timeline: varchar('timeline', { length: 100 }), // "asap", "3-6months", etc.
    projectDescription: text('project_description'),
    attachments: jsonb('attachments').default([]), // Array of file URLs
    status: varchar('status', { length: 50 }).default('pending'), // pending, contacted, in-progress, completed
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('service_request_user_idx').on(table.userId),
    serviceIdIdx: index('service_request_service_idx').on(table.serviceId),
    statusIdx: index('service_request_status_idx').on(table.status),
  })
);

// FAQ Table
export const faqs = pgTable(
  'faqs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: varchar('category', { length: 100 }).notNull(), // General, Interior Design, Architecture, etc.
    question: varchar('question', { length: 500 }).notNull(),
    answer: text('answer').notNull(),
    order: integer('order').default(0),
    views: integer('views').default(0),
    helpful: integer('helpful').default(0),
    notHelpful: integer('not_helpful').default(0),
    status: varchar('status', { length: 50 }).default('published'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('faq_category_idx').on(table.category),
    orderIdx: index('faq_order_idx').on(table.order),
    statusIdx: index('faq_status_idx').on(table.status),
  })
);

// Sourcing Requests Table
export const sourcingRequests = pgTable(
  'sourcing_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }),
    quantity: integer('quantity'),
    budget: decimal('budget', { precision: 12, scale: 2 }),
    targetLocation: varchar('target_location', { length: 255 }),
    specifications: jsonb('specifications'),
    images: jsonb('images').default([]), // Cloudinary URLs
    status: varchar('status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('sourcing_request_user_idx').on(table.userId),
    statusIdx: index('sourcing_request_status_idx').on(table.status),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  consultations: many(consultations),
  quotes: many(quotes),
  comments: many(comments),
  likes: many(likes),
  tradeMembers: many(tradeMembers),
  memberships: many(memberships),
  sourcingRequests: many(sourcingRequests),
  cart: many(carts),
}));

// Replace existing productsRelations
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  productImages: many(productImages),
  comments: many(comments),
  likes: many(likes),
}));

// New relations for variants and images
export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  colorVariant: one(productVariants, {
    fields: [productImages.colorId],
    references: [productVariants.id],
  }),
}));


export const projectsRelations = relations(projects, ({ many }) => ({
  comments: many(comments),
  likes: many(likes),
}));

export const articlesRelations = relations(articles, ({ many }) => ({
  comments: many(comments),
  likes: many(likes),
}));

// Add this at the end of @/lib/db/schema.ts

export const subscribers = pgTable(
  'subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    brevoContactId: varchar('brevo_contact_id', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('subscriber_email_idx').on(table.email),
  })
);

