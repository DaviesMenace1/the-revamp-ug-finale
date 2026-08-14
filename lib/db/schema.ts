import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  decimal,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. ENUMS
// ==========================================

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

export const variantTypeEnum = pgEnum('variant_type', [
  'COLOR',
  'FABRIC',
  'MATERIAL',
  'SIZE',
]);

export const productAvailabilityEnum = pgEnum('product_availability', [
  'in_stock',
  'out_of_stock',
  'made_to_order',
  'pre_order',
  'available_on_request',
]);

export const productConditionEnum = pgEnum('product_condition', [
  'new',
  'refurbished',
  'used',
]);

export const googleSyncStatusEnum = pgEnum('google_sync_status', [
  'draft',
  'pending',
  'synced',
  'error',
  'rejected',
]);

export const productTypeEnum = pgEnum('product_type', [
  'standard',
  'made_to_order',
  'custom_bespoke',
  'sourced_on_request',
  'pre_order',
  'set',
  'bundle',
  'sample',
]);

// ==========================================
// 2. TABLES
// ==========================================

// --- USERS TABLE ---
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    country: varchar('country', { length: 100 }),
    city: varchar('city', { length: 100 }),
    company: varchar('company', { length: 255 }),
    role: userRoleEnum('role').default('customer'),
    avatar: text('avatar'),
    bio: text('bio'),
    marketingConsent: boolean('marketing_consent').default(true),
    preferredLanguage: varchar('preferred_language', { length: 5 }).default('en'),
    brevoContactId: varchar('brevo_contact_id', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('email_idx').on(table.email),
    clerkIdx: uniqueIndex('clerk_id_idx').on(table.clerkId),
    roleIdx: index('role_idx').on(table.role),
  })
);

// ==========================================
// TAXONOMY, LIBRARIES & TEMPLATES
// ==========================================

// --- MATERIAL LIBRARY ---
export const materialLibrary = pgTable(
  'material_library',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(), // e.g., "Oak", "Travertine"
    baseType: varchar('base_type', { length: 100 }).notNull(), // e.g., "Wood", "Stone", "Metal"
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex('material_name_idx').on(table.name),
    baseTypeIdx: index('material_base_type_idx').on(table.baseType),
  })
);

// --- FINISH LIBRARY ---
export const finishLibrary = pgTable(
  'finish_library',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(), // e.g., "Smoked Oak", "Brushed Brass"
    baseType: varchar('base_type', { length: 100 }), // e.g., "Wood Finish", "Metal Finish"
    swatchImage: text('swatch_image'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex('finish_name_idx').on(table.name),
  })
);

// --- FABRIC LIBRARY ---
export const fabricLibrary = pgTable(
  'fabric_library',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(), // e.g., "Bouclé Ivory"
    code: varchar('code', { length: 100 }).unique(),
    composition: varchar('composition', { length: 255 }), // e.g., "100% Linen"
    martindaleRating: integer('martindale_rating'),
    fireRating: varchar('fire_rating', { length: 100 }),
    indoorOutdoor: boolean('indoor_outdoor').default(false),
    swatchImage: text('swatch_image'),
    priceTier: integer('price_tier').default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: uniqueIndex('fabric_code_idx').on(table.code),
  })
);

// --- ATTRIBUTE TEMPLATES ---
export const attributeTemplates = pgTable(
  'attribute_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(), // e.g., "SOFA_TEMPLATE"
    schemaDefinition: jsonb('schema_definition').notNull(), // Defines field layout, measurements, library restrictions
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex('template_name_idx').on(table.name),
  })
);

// --- DEPARTMENTS ---
export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(), // e.g., "01. FURNITURE"
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    order: integer('order').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('department_slug_idx').on(table.slug),
  })
);

// --- CATEGORIES ---
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(), // e.g., "Living Room"
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    order: integer('order').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    departmentIdx: index('category_department_idx').on(table.departmentId),
    slugIdx: uniqueIndex('category_slug_idx').on(table.slug),
  })
);

// --- SUBCATEGORIES ---
export const subCategories = pgTable(
  'sub_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => attributeTemplates.id),
    name: varchar('name', { length: 255 }).notNull(), // e.g., "Sofas"
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    googleProductCategoryId: varchar('google_product_category_id', { length: 255 }), // e.g., "6385"
    order: integer('order').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('sub_category_category_idx').on(table.categoryId),
    templateIdx: index('sub_category_template_idx').on(table.templateId),
    slugIdx: uniqueIndex('sub_category_slug_idx').on(table.slug),
  })
);

// --- PRODUCTS TABLE (REFACTORED) ---
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    mpn: varchar('mpn', { length: 100 }),
    gtin: varchar('gtin', { length: 100 }),
    brand: varchar('brand', { length: 100 }).default('The Revamp UG'),

    // Modern Relational Taxonomy & Operations
    subCategoryId: uuid('sub_category_id').references(() => subCategories.id),
    productType: productTypeEnum('product_type').default('standard'),

    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    originalPrice: numeric('original_price', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 10 }).default('UGX'),

    condition: productConditionEnum('condition').default('new'),
    availability: productAvailabilityEnum('availability').default('in_stock'),
    inStock: boolean('in_stock').default(true),
    quantity: integer('quantity').default(0),
    leadTime: varchar('lead_time', { length: 100 }),

    description: text('description'),
    longDescription: text('long_description'),
    editorialHighlight: text('editorial_highlight'),

    // All dynamic metadata (dimensions, libraries selected, care instructions, etc.) dictated by attribute template
    attributes: jsonb('attributes').default({}),

    // Media
    thumbnailImage: text('thumbnail_image'),
    images: jsonb('images').$type<string[]>().default([]),

    // Ratings & Reviews
    rating: numeric('rating', { precision: 3, scale: 2 }).default('5.00'),
    ratingCount: integer('rating_count').default(0),

    // Google Sync
    googleSyncStatus: googleSyncStatusEnum('google_sync_status').default('draft'),
    googleSyncError: text('google_sync_error'),

    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: text('seo_description'),
    featured: boolean('featured').default(false),
    status: varchar('status', { length: 50 }).default('draft'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    subCategoryIdx: index('product_sub_category_idx').on(table.subCategoryId),
    skuIdx: uniqueIndex('product_sku_idx').on(table.sku),
    slugIdx: uniqueIndex('product_slug_idx').on(table.slug),
    statusIdx: index('product_status_idx').on(table.status),
    googleSyncIdx: index('product_google_sync_idx').on(table.googleSyncStatus),
  })
);

// --- PRODUCT IMAGES TABLE ---
export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    colorId: uuid('color_id'),
    url: text('url').notNull(),
    isPrimary: boolean('is_primary').default(false),
    displayOrder: integer('display_order').default(0),
    altText: text('alt_text'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    productIdx: index('product_images_product_idx').on(table.productId),
    colorIdx: index('product_images_color_idx').on(table.colorId),
  })
);

// --- PRODUCT VARIANTS TABLE ---
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // 'COLOR' or 'FABRIC'
    label: varchar('label', { length: 100 }).notNull(),
    value: varchar('value', { length: 100 }), // Hex value or code
    priceDelta: numeric('price_delta', { precision: 12, scale: 2 }).default('0'),
    sku: varchar('sku', { length: 100 }),
    quantity: integer('quantity').default(0),
    gtin: varchar('gtin', { length: 100 }),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    productIdx: index('product_variant_product_idx').on(table.productId),
    typeIdx: index('product_variant_type_idx').on(table.type),
    skuIdx: index('product_variant_sku_idx').on(table.sku),
  })
);

// --- PRODUCT REVIEWS TABLE ---
export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    authorName: varchar('author_name', { length: 255 }).notNull().default('Verified Buyer'),
    authorEmail: varchar('author_email', { length: 255 }),
    rating: integer('rating').notNull().default(5),
    title: varchar('title', { length: 255 }),
    comment: text('comment').notNull(),
    verifiedPurchase: boolean('verified_purchase').default(true),
    approved: boolean('approved').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index('product_reviews_product_idx').on(table.productId),
    ratingIdx: index('product_reviews_rating_idx').on(table.rating),
  })
);

// --- PROJECTS TABLE ---
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
    images: jsonb('images').default([]),
    gallery: jsonb('gallery').default([]),
    thumbnailImage: text('thumbnail_image'),
    designer: varchar('designer', { length: 255 }),
    status: projectStatusEnum('status').default('consultation_scheduled'),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
    ratingCount: integer('rating_count').default(0),
    likes: integer('likes').default(0),
    views: integer('views').default(0),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: varchar('seo_description', { length: 255 }),
    ogImage: text('og_image'),
    tags: jsonb('tags').default([]),
    relatedProjects: jsonb('related_projects').default([]),
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

// --- ARTICLES TABLE ---
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
    tags: jsonb('tags').default([]),
    featuredImage: text('featured_image'),
    gallery: jsonb('gallery').default([]),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
    ratingCount: integer('rating_count').default(0),
    likes: integer('likes').default(0),
    views: integer('views').default(0),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: varchar('seo_description', { length: 255 }),
    ogImage: text('og_image'),
    relatedArticles: jsonb('related_articles').default([]),
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

// --- CARTS TABLE ---
export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    items: jsonb('items').default([]),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('cart_user_idx').on(table.userId),
  })
);

// --- ORDERS TABLE ---
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    userId: text('user_id').notNull(),
    items: jsonb('items').default([]),
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

// --- CONSULTATIONS TABLE ---
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

// --- QUOTES TABLE ---
export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteNumber: varchar('quote_number', { length: 50 }).notNull().unique(),
    userId: uuid('user_id').notNull(),
    consultationId: uuid('consultation_id'),
    items: jsonb('items').default([]),
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

// --- COMMENTS TABLE ---
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

// --- LIKES TABLE ---
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

// --- TRADE MEMBERS TABLE ---
export const tradeMembers = pgTable(
  'trade_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    businessName: varchar('business_name', { length: 255 }).notNull(),
    businessCategory: varchar('business_category', { length: 100 }),
    tradeType: varchar('trade_type', { length: 100 }),
    taxNumber: varchar('tax_number', { length: 50 }),
    businessLicense: text('business_license'),
    certificate: text('certificate'),
    status: varchar('status', { length: 50 }).default('pending'),
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

// --- MEMBERSHIPS TABLE ---
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    membershipType: varchar('membership_type', { length: 50 }).notNull(),
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

// --- SERVICE CATEGORIES TABLE ---
export const serviceCategories = pgTable(
  'service_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    image: text('image'),
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

// --- SERVICES TABLE ---
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => serviceCategories.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    longDescription: text('long_description'),
    icon: varchar('icon', { length: 100 }),
    image: text('image'),
    gallery: jsonb('gallery').default([]),
    order: integer('order').default(0),
    featured: boolean('featured').default(false),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: varchar('seo_description', { length: 255 }),
    ogImage: text('og_image'),
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

// --- SERVICE REQUESTS TABLE ---
export const serviceRequests = pgTable(
  'service_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    serviceId: uuid('service_id').references(() => services.id),
    serviceType: varchar('service_type', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    company: varchar('company', { length: 255 }),
    budget: varchar('budget', { length: 100 }),
    timeline: varchar('timeline', { length: 100 }),
    projectDescription: text('project_description'),
    attachments: jsonb('attachments').default([]),
    status: varchar('status', { length: 50 }).default('pending'),
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

// --- FAQS TABLE ---
export const faqs = pgTable(
  'faqs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: varchar('category', { length: 100 }).notNull(),
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

// --- SOURCING REQUESTS TABLE ---
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
    images: jsonb('images').default([]),
    status: varchar('status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('sourcing_request_user_idx').on(table.userId),
    statusIdx: index('sourcing_request_status_idx').on(table.status),
  })
);

// --- SUBSCRIBERS TABLE ---
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

// ==========================================
// 3. DRIZZLE RELATIONS
// ==========================================

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

export const departmentsRelations = relations(departments, ({ many }) => ({
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  department: one(departments, {
    fields: [categories.departmentId],
    references: [departments.id],
  }),
  subCategories: many(subCategories),
}));

export const subCategoriesRelations = relations(subCategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subCategories.categoryId],
    references: [categories.id],
  }),
  template: one(attributeTemplates, {
    fields: [subCategories.templateId],
    references: [attributeTemplates.id],
  }),
  products: many(products),
}));

export const attributeTemplatesRelations = relations(attributeTemplates, ({ many }) => ({
  subCategories: many(subCategories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  subCategory: one(subCategories, {
    fields: [products.subCategoryId],
    references: [subCategories.id],
  }),
  productVariants: many(productVariants),
  productImages: many(productImages),
  productReviews: many(productReviews),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
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

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  requests: many(serviceRequests),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  service: one(services, {
    fields: [serviceRequests.serviceId],
    references: [services.id],
  }),
}));
