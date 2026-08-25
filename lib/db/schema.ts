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
} from "drizzle-orm/pg-core"

import { relations } from "drizzle-orm"

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "designer",
  "admin",
  "trade_member",
  "architect",
  "interior_designer",
])

export const projectStatusEnum = pgEnum("project_status", [
  "consultation_scheduled",
  "design_phase",
  "procurement_phase",
  "installation_phase",
  "completed",
  "on_hold",
])

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
])

export const variantTypeEnum = pgEnum("variant_type", [
  "COLOR",
  "FABRIC",
  "MATERIAL",
  "SIZE",
])

export const productAvailabilityEnum = pgEnum("product_availability", [
  "in_stock",
  "out_of_stock",
  "made_to_order",
  "pre_order",
  "available_on_request",
])

export const productConditionEnum = pgEnum("product_condition", [
  "new",
  "refurbished",
  "used",
])

export const googleSyncStatusEnum = pgEnum("google_sync_status", [
  "draft",
  "pending",
  "synced",
  "error",
  "rejected",
])

export const productTypeEnum = pgEnum("product_type", [
  "standard",
  "made_to_order",
  "custom_bespoke",
  "sourced_on_request",
  "pre_order",
  "set",
  "bundle",
  "sample",
])

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "ready_for_review",
  "published",
  "archived",
])

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    company: varchar("company", { length: 255 }),
    role: userRoleEnum("role").default("customer"),
    avatar: text("avatar"),
    bio: text("bio"),
    marketingConsent: boolean("marketing_consent").default(true),
    preferredLanguage: varchar("preferred_language", { length: 5 }).default("en"),
    brevoContactId: varchar("brevo_contact_id", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    clerkIdx: uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    roleIdx: index("users_role_idx").on(table.role),
  }),
)

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    order: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("departments_slug_idx").on(table.slug),
    activeOrderIdx: index("departments_active_order_idx").on(
      table.active,
      table.order,
    ),
  }),
)

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    order: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    departmentIdx: index("categories_department_idx").on(table.departmentId),
    slugIdx: uniqueIndex("categories_department_slug_idx").on(
      table.departmentId,
      table.slug,
    ),
    activeOrderIdx: index("categories_active_order_idx").on(
      table.active,
      table.order,
    ),
  }),
)

export const attributeTemplates = pgTable(
  "attribute_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    version: integer("version").notNull().default(1),
    schemaDefinition: jsonb("schema_definition")
      .$type<{
        version?: number
        groups?: Array<{
          key: string
          label: string
          description?: string
          fields: Array<{
            key: string
            label: string
            type:
              | "text"
              | "textarea"
              | "number"
              | "measurement"
              | "select"
              | "multiselect"
              | "boolean"
              | "color"
              | "fabric"
              | "material"
              | "finish"
            required?: boolean
            description?: string
            placeholder?: string
            unit?: string
            min?: number
            max?: number
            step?: number
            options?: Array<{
              label: string
              value: string
            }>
            library?:
              | "color_library"
              | "material_library"
              | "fabric_library"
              | "finish_library"
          }>
        }>
        fields?: Array<{
          key: string
          label: string
          type:
            | "text"
            | "textarea"
            | "number"
            | "measurement"
            | "select"
            | "multiselect"
            | "boolean"
            | "color"
            | "fabric"
            | "material"
            | "finish"
          required?: boolean
          description?: string
          placeholder?: string
          unit?: string
          min?: number
          max?: number
          step?: number
          options?: Array<{
            label: string
            value: string
          }>
          library?:
            | "color_library"
            | "material_library"
            | "fabric_library"
            | "finish_library"
        }>
      }>()
      .notNull(),
    active: boolean("active").notNull().default(true),
    code: text("code"),
    templateType: text("template_type").default("product"),
    googleProductType: text("google_product_type"),
    googleCategoryId: text("google_category_id"),
    measurementSystem: text("measurement_system").default("metric"),
    notes: text("notes"),
    metadata: jsonb("metadata").notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("attribute_templates_slug_idx").on(table.slug),
    activeIdx: index("attribute_templates_active_idx").on(table.active),
  }),
)

export const subCategories = pgTable(
  "sub_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .references(() => attributeTemplates.id, {
        onDelete: "set null",
      }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    googleProductCategoryId: varchar("google_product_category_id", {
      length: 255,
    }),
    googleProductCategoryPath: text("google_product_category_path"),
    active: boolean("active").notNull().default(true),
    order: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("sub_categories_category_idx").on(table.categoryId),
    templateIdx: index("sub_categories_template_idx").on(table.templateId),
    slugIdx: uniqueIndex("sub_categories_category_slug_idx").on(
      table.categoryId,
      table.slug,
    ),
    googleCategoryIdx: index(
      "sub_categories_google_category_idx",
    ).on(table.googleProductCategoryId),
  }),
)

export const colorLibrary = pgTable(
  "colors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    family: varchar("family", { length: 100 }),
    hex: varchar("hex_code", { length: 20 }),
    description: text("description"),
    swatchImage: text("swatch_image"),
    active: boolean("active").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("color_library_slug_idx").on(table.slug),
    familyIdx: index("color_library_family_idx").on(table.family),
    activeIdx: index("color_library_active_idx").on(table.active),
  }),
)

export const materialLibrary = pgTable(
  "material_library",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    baseType: varchar("base_type", { length: 100 }).notNull(),
    description: text("description"),
    swatchImage: text("swatch_image"),
    active: boolean("active").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("material_library_slug_idx").on(table.slug),
    baseTypeIdx: index("material_library_base_type_idx").on(table.baseType),
    activeIdx: index("material_library_active_idx").on(table.active),
  }),
)

export const finishLibrary = pgTable(
  "finish_library",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    baseType: varchar("base_type", { length: 100 }),
    colorId: uuid("colour_id").references(() => colorLibrary.id, {
      onDelete: "set null",
    }),
    /** legacy free-text colour label, superseded by colorId but still present in the DB */
    colourLabel: text("colour"),
    description: text("description"),
    swatchImage: text("swatch_image"),
    active: boolean("active").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("finish_library_slug_idx").on(table.slug),
    colorIdx: index("finish_library_color_idx").on(table.colorId),
    activeIdx: index("finish_library_active_idx").on(table.active),
  }),
)

export const fabricLibrary = pgTable(
  "fabric_library",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    code: varchar("code", { length: 100 }),
    composition: varchar("composition", { length: 255 }),
    martindaleRating: integer("martindale_rating"),
    fireRating: varchar("fire_rating", { length: 100 }),
    indoorOutdoor: boolean("indoor_outdoor").default(false),
    pattern: varchar("pattern", { length: 100 }),
    colorId: uuid("colour_id").references(() => colorLibrary.id, {
      onDelete: "set null",
    }),
    supplier: varchar("supplier", { length: 255 }),
    careInstructions: text("care_instructions"),
    priceTier: integer("price_tier").default(1),
    swatchImage: text("swatch_image"),
    active: boolean("active").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("fabric_library_slug_idx").on(table.slug),
    codeIdx: uniqueIndex("fabric_library_code_idx").on(table.code),
    colorIdx: index("fabric_library_color_idx").on(table.colorId),
    activeIdx: index("fabric_library_active_idx").on(table.active),
  }),
)

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    mpn: varchar("mpn", { length: 100 }),
    gtin: varchar("gtin", { length: 100 }),
    brand: varchar("brand", { length: 150 }).default("The Revamp UG"),
    manufacturer: varchar("manufacturer", { length: 255 }),
    countryOfOrigin: varchar("country_of_origin", { length: 100 }),

    subCategoryId: uuid("sub_category_id")
      .notNull()
      .references(() => subCategories.id, {
        onDelete: "restrict",
      }),

    productType: productTypeEnum("product_type")
      .notNull()
      .default("standard"),

    price: numeric("price", {
      precision: 14,
      scale: 2,
    }).notNull(),

    originalPrice: numeric("original_price", {
      precision: 14,
      scale: 2,
    }),

    currency: varchar("currency", { length: 10 })
      .notNull()
      .default("UGX"),

    condition: productConditionEnum("condition")
      .notNull()
      .default("new"),

    availability: productAvailabilityEnum("availability")
      .notNull()
      .default("in_stock"),

    quantity: integer("quantity").notNull().default(0),

    leadTime: varchar("lead_time", { length: 150 }),

    weight: numeric("weight", {
      precision: 12,
      scale: 3,
    }),

    weightUnit: varchar("weight_unit", { length: 20 })
      .notNull()
      .default("kg"),

    description: text("description"),
    longDescription: text("long_description"),
    editorialHighlight: text("editorial_highlight"),

    attributes: jsonb("attributes")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    tags: jsonb("tags").notNull().default([]),
    careInstructions: text("care_instructions"),
    whatsIncluded: jsonb("whats_included").notNull().default([]),
    ogImage: text("og_image"),

    rating: numeric("rating", {
      precision: 3,
      scale: 2,
    }).default("0"),

    ratingCount: integer("rating_count").notNull().default(0),

    likes: integer("likes").notNull().default(0),
    views: integer("views").notNull().default(0),

    googleProductCategoryId: varchar(
      "google_product_category_id",
      { length: 255 },
    ),

    googleProductCategoryPath: text(
      "google_product_category_path",
    ),

    googleProductId: varchar("google_product_id", {
      length: 255,
    }),

    googleSyncStatus: googleSyncStatusEnum(
      "google_sync_status",
    )
      .notNull()
      .default("draft"),

    googleSyncError: text("google_sync_error"),

    googleLastSyncedAt: timestamp("google_last_synced_at", {
      withTimezone: true,
    }),

    googleCategoryOverride: text("google_category_override"),

    googleApprovedAt: timestamp(
      "google_approved_at",
    ),

    googleDisapprovalReason: text(
      "google_disapproval_reason",
    ),

    canonicalUrl: text("canonical_url"),

    seoTitle: varchar("seo_title", {
      length: 255,
    }),

    seoDescription: text("seo_description"),

    featured: boolean("featured").notNull().default(false),
    isNewArrival: boolean("is_new_arrival").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isOnSale: boolean("is_on_sale").notNull().default(false),

    status: productStatusEnum("status")
      .notNull()
      .default("draft"),

    publishedAt: timestamp("published_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    skuIdx: uniqueIndex("products_sku_idx").on(table.sku),
    slugIdx: uniqueIndex("products_slug_idx").on(table.slug),
    gtinIdx: index("products_gtin_idx").on(table.gtin),
    subCategoryIdx: index("products_sub_category_idx").on(
      table.subCategoryId,
    ),
    statusIdx: index("products_status_idx").on(table.status),
    availabilityIdx: index("products_availability_idx").on(
      table.availability,
    ),
    googleSyncIdx: index("products_google_sync_idx").on(
      table.googleSyncStatus,
    ),
    googleCategoryIdx: index("products_google_category_idx").on(
      table.googleProductCategoryId,
    ),
    featuredIdx: index("products_featured_idx").on(table.featured),
    newArrivalIdx: index("products_new_arrival_idx").on(
      table.isNewArrival,
    ),
    bestSellerIdx: index("products_best_seller_idx").on(
      table.isBestSeller,
    ),
  }),
)

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    type: variantTypeEnum("type").notNull(),

    label: varchar("label", {
      length: 150,
    }).notNull(),

    value: varchar("value", {
      length: 150,
    }).notNull(),

    colorId: uuid("color_id").references(() => colorLibrary.id, {
      onDelete: "set null",
    }),

    fabricId: uuid("fabric_id").references(() => fabricLibrary.id, {
      onDelete: "set null",
    }),

    materialId: uuid("material_id").references(
      () => materialLibrary.id,
      {
        onDelete: "set null",
      },
    ),

    sku: varchar("sku", { length: 100 }),
    mpn: varchar("mpn", { length: 100 }),
    gtin: varchar("gtin", { length: 100 }),

    priceDelta: numeric("price_delta", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0"),

    quantity: integer("quantity").notNull().default(0),

    availability: productAvailabilityEnum("availability")
      .notNull()
      .default("in_stock"),

    attributes: jsonb("attributes")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("product_variants_product_idx").on(
      table.productId,
    ),
    typeIdx: index("product_variants_type_idx").on(table.type),
    colorIdx: index("product_variants_color_idx").on(table.colorId),
    fabricIdx: index("product_variants_fabric_idx").on(table.fabricId),
    materialIdx: index("product_variants_material_idx").on(
      table.materialId,
    ),
    skuIdx: uniqueIndex("product_variants_sku_idx").on(table.sku),
  }),
)

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    variantId: uuid("variant_id").references(
      () => productVariants.id,
      {
        onDelete: "set null",
      },
    ),

    url: text("url").notNull(),

    altText: text("alt_text"),

    isPrimary: boolean("is_primary").notNull().default(false),

    displayOrder: integer("display_order").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("product_images_product_idx").on(
      table.productId,
    ),
    variantIdx: index("product_images_variant_idx").on(
      table.variantId,
    ),
    primaryIdx: index("product_images_primary_idx").on(
      table.productId,
      table.isPrimary,
    ),
  }),
)

export const productReviews = pgTable(
  "product_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id"),

    authorName: varchar("author_name", {
      length: 255,
    })
      .notNull()
      .default("Verified Buyer"),

    authorEmail: varchar("author_email", {
      length: 255,
    }),

    rating: integer("rating").notNull().default(5),

    title: varchar("title", {
      length: 255,
    }),

    comment: text("comment").notNull(),

    verifiedPurchase: boolean("verified_purchase")
      .notNull()
      .default(true),

    approved: boolean("approved")
      .notNull()
      .default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("product_reviews_product_idx").on(
      table.productId,
    ),
    ratingIdx: index("product_reviews_rating_idx").on(
      table.rating,
    ),
    approvedIdx: index("product_reviews_approved_idx").on(
      table.approved,
    ),
  }),
)

export const productRelations = pgTable(
  "product_relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    relatedProductId: uuid("related_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    relationType: varchar("relation_type", { length: 50 })
      .notNull()
      .default("related"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("product_relations_product_idx").on(table.productId),
    relatedIdx: index("product_relations_related_idx").on(
      table.relatedProductId,
    ),
  }),
)

export const productTaxonomyRules = pgTable(
  "product_taxonomy_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id").references(() => departments.id),
    categoryId: uuid("category_id").references(() => categories.id),
    subCategoryId: uuid("sub_category_id").references(
      () => subCategories.id,
    ),
    templateId: uuid("template_id").references(() => attributeTemplates.id),
    ruleType: text("rule_type").notNull().default("form"),
    priority: integer("priority").notNull().default(100),
    googleProductType: text("google_product_type"),
    metadata: jsonb("metadata").notNull().default({}),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    departmentIdx: index("taxonomy_rules_department_idx").on(
      table.departmentId,
    ),
    categoryIdx: index("taxonomy_rules_category_idx").on(table.categoryId),
    subCategoryIdx: index("taxonomy_rules_sub_category_idx").on(
      table.subCategoryId,
    ),
    templateIdx: index("taxonomy_rules_template_idx").on(table.templateId),
  }),
)

export const productAttributeDefinitions = pgTable(
  "product_attribute_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => attributeTemplates.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    fieldType: text("field_type").notNull().default("text"),
    unit: text("unit"),
    required: boolean("required").notNull().default(false),
    searchable: boolean("searchable").notNull().default(false),
    filterable: boolean("filterable").notNull().default(false),
    variantLevel: boolean("variant_level").notNull().default(false),
    googleAttribute: text("google_attribute"),
    validation: jsonb("validation").notNull().default({}),
    options: jsonb("options").notNull().default([]),
    displayOrder: integer("display_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    templateIdx: index("attribute_definitions_template_idx").on(
      table.templateId,
    ),
  }),
)

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    longDescription: text("long_description"),
    category: varchar("category", { length: 100 }),
    subCategory: varchar("sub_category", { length: 100 }),
    clientName: varchar("client_name", { length: 255 }),
    userId: uuid("user_id").references(() => users.id),
    client: text("client"),
    shortDescription: text("short_description"),
    location: varchar("location", { length: 255 }),
    budget: decimal("budget", { precision: 12, scale: 2 }),
    progress: integer("progress").default(0),
    currentPhase: varchar("current_phase", { length: 50 }).default("consultation"),
    projectKind: varchar("project_kind", { length: 20 }).notNull().default("portfolio"),
    year: text("year"),
    dueDate: timestamp("due_date"),
    images: jsonb("images").default([]),
    gallery: jsonb("gallery").default([]),
    thumbnailImage: text("thumbnail_image"),
    designer: varchar("designer", { length: 255 }),
    status: projectStatusEnum("status").default(
      "consultation_scheduled",
    ),
    rating: decimal("rating", {
      precision: 3,
      scale: 2,
    }).default("0"),
    ratingCount: integer("rating_count").default(0),
    likes: integer("likes").default(0),
    views: integer("views").default(0),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", {
      length: 255,
    }),
    ogImage: text("og_image"),
    tags: jsonb("tags").default([]),
    relatedProjects: jsonb("related_projects").default([]),
    featured: boolean("featured").default(false),
    publishStatus: varchar("publish_status", {
      length: 50,
    }).default("published"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    publishedAt: timestamp("published_at"),
  },
  (table) => ({
    categoryIdx: index("project_category_idx").on(table.category),
    statusIdx: index("project_status_idx").on(table.status),
    slugIdx: uniqueIndex("project_slug_idx").on(table.slug),
    featuredIdx: index("project_featured_idx").on(table.featured),
  }),
)

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    content: text("content").notNull(),
    excerpt: varchar("excerpt", { length: 500 }),
    author: varchar("author", { length: 255 }),
    category: varchar("category", { length: 100 }),
    tags: jsonb("tags").default([]),
    featuredImage: text("featured_image"),
    rating: decimal("rating", {
      precision: 3,
      scale: 2,
    }).default("0"),
    ratingCount: integer("rating_count").default(0),
    likes: integer("likes").default(0),
    views: integer("views").default(0),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", {
      length: 255,
    }),
    status: varchar("status", { length: 50 }).default("published"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    publishedAt: timestamp("published_at"),
  },
  (table) => ({
    categoryIdx: index("article_category_idx").on(table.category),
    statusIdx: index("article_status_idx").on(table.status),
    slugIdx: uniqueIndex("article_slug_idx").on(table.slug),
  }),
)

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    items: jsonb("items").default([]),
    subtotal: decimal("subtotal", {
      precision: 12,
      scale: 2,
    }).default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("cart_user_idx").on(table.userId),
  }),
)

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", {
      length: 50,
    })
      .notNull()
      .unique(),
    userId: text("user_id").notNull(),
    items: jsonb("items").default([]),
    subtotal: decimal("subtotal", {
      precision: 12,
      scale: 2,
    }).notNull(),
    tax: decimal("tax", {
      precision: 12,
      scale: 2,
    }).default("0"),
    shipping: decimal("shipping", {
      precision: 12,
      scale: 2,
    }).default("0"),
    discount: decimal("discount", {
      precision: 12,
      scale: 2,
    }).default("0"),
    total: decimal("total", {
      precision: 12,
      scale: 2,
    }).notNull(),
    status: orderStatusEnum("status").default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").default(
      "pending",
    ),
    deliveryAddress: jsonb("delivery_address"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("order_user_idx").on(table.userId),
    statusIdx: index("order_status_idx").on(table.status),
    orderNumberIdx: uniqueIndex("order_number_idx").on(
      table.orderNumber,
    ),
  }),
)

export const consultations = pgTable(
  "consultations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    serviceType: varchar("service_type", { length: 100 }),
    budget: decimal("budget", {
      precision: 12,
      scale: 2,
    }),
    preferredDate: timestamp("preferred_date"),
    mode: varchar("mode", { length: 20 }).notNull().default("virtual"),
    meetingLink: text("meeting_link"),
    location: text("location"),
    durationMinutes: integer("duration_minutes").notNull().default(45),
    confirmedAt: timestamp("confirmed_at"),
    status: varchar("status", { length: 50 }).default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("consultation_user_idx").on(table.userId),
    statusIdx: index("consultation_status_idx").on(table.status),
  }),
)

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteNumber: varchar("quote_number", {
      length: 50,
    })
      .notNull()
      .unique(),
    userId: uuid("user_id").notNull(),
    consultationId: uuid("consultation_id"),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    pdfUrl: text("pdf_url"),
    items: jsonb("items"),
    subtotal: decimal("subtotal", {
      precision: 12,
      scale: 2,
    }),
    tax: decimal("tax", {
      precision: 12,
      scale: 2,
    }).default("0"),
    total: decimal("total", {
      precision: 12,
      scale: 2,
    }).notNull(),
    validUntil: timestamp("valid_until"),
    status: varchar("status", { length: 50 }).default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("quote_user_idx").on(table.userId),
    statusIdx: index("quote_status_idx").on(table.status),
  }),
)

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    productId: uuid("product_id"),
    projectId: uuid("project_id"),
    articleId: uuid("article_id"),
    content: text("content").notNull(),
    rating: integer("rating"),
    approved: boolean("approved").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("comment_user_idx").on(table.userId),
    productIdIdx: index("comment_product_idx").on(table.productId),
    projectIdIdx: index("comment_project_idx").on(table.projectId),
    articleIdIdx: index("comment_article_idx").on(table.articleId),
  }),
)

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    productId: uuid("product_id"),
    projectId: uuid("project_id"),
    articleId: uuid("article_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("like_user_idx").on(table.userId),
    productIdIdx: index("like_product_idx").on(table.productId),
    projectIdIdx: index("like_project_idx").on(table.projectId),
    articleIdIdx: index("like_article_idx").on(table.articleId),
    userProductUnique: uniqueIndex("user_product_unique").on(
      table.userId,
      table.productId,
    ),
    userProjectUnique: uniqueIndex("user_project_unique").on(
      table.userId,
      table.projectId,
    ),
    userArticleUnique: uniqueIndex("user_article_unique").on(
      table.userId,
      table.articleId,
    ),
  }),
)

export const tradeMembers = pgTable(
  "trade_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    businessName: varchar("business_name", {
      length: 255,
    }).notNull(),
    businessCategory: varchar("business_category", {
      length: 100,
    }),
    tradeType: varchar("trade_type", { length: 100 }),
    taxNumber: varchar("tax_number", { length: 50 }),
    businessLicense: text("business_license"),
    certificate: text("certificate"),
    status: varchar("status", { length: 50 }).default("pending"),
    tier: varchar("tier", { length: 50 }).default("standard"),
    discountRate: numeric("discount_rate", { precision: 5, scale: 2 }).default("10.00"),
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("trade_member_user_idx").on(table.userId),
    statusIdx: index("trade_member_status_idx").on(table.status),
  }),
)

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    membershipType: varchar("membership_type", {
      length: 50,
    }).notNull(),
    status: varchar("status", { length: 50 }).default("active"),
    startDate: timestamp("start_date").notNull().defaultNow(),
    endDate: timestamp("end_date"),
    benefits: jsonb("benefits").default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("membership_user_idx").on(table.userId),
    typeIdx: index("membership_type_idx").on(table.membershipType),
  }),
)

export const serviceCategories = pgTable(
  "service_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }),
    image: text("image"),
    order: integer("order").default(0),
    featured: boolean("featured").default(false),
    status: varchar("status", { length: 50 }).default("published"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("service_category_slug_idx").on(table.slug),
    statusIdx: index("service_category_status_idx").on(table.status),
    orderIdx: index("service_category_order_idx").on(table.order),
  }),
)

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    longDescription: text("long_description"),
    icon: varchar("icon", { length: 100 }),
    image: text("image"),
    gallery: jsonb("gallery").default([]),
    order: integer("order").default(0),
    featured: boolean("featured").default(false),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", {
      length: 255,
    }),
    ogImage: text("og_image"),
    status: varchar("status", { length: 50 }).default("published"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdIdx: index("service_category_id_idx").on(
      table.categoryId,
    ),
    slugIdx: uniqueIndex("service_slug_idx").on(table.slug),
    statusIdx: index("service_status_idx").on(table.status),
    orderIdx: index("service_order_idx").on(table.order),
  }),
)

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    serviceId: uuid("service_id").references(() => services.id),
    serviceType: varchar("service_type", {
      length: 100,
    }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    company: varchar("company", { length: 255 }),
    budget: varchar("budget", { length: 100 }),
    timeline: varchar("timeline", { length: 100 }),
    projectDescription: text("project_description"),
    attachments: jsonb("attachments").default([]),
    status: varchar("status", { length: 50 }).default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("service_request_user_idx").on(table.userId),
    serviceIdIdx: index("service_request_service_idx").on(
      table.serviceId,
    ),
    statusIdx: index("service_request_status_idx").on(table.status),
  }),
)

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: varchar("category", { length: 100 }).notNull(),
    question: varchar("question", { length: 500 }).notNull(),
    answer: text("answer").notNull(),
    order: integer("order").default(0),
    views: integer("views").default(0),
    helpful: integer("helpful").default(0),
    notHelpful: integer("not_helpful").default(0),
    status: varchar("status", { length: 50 }).default("published"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("faq_category_idx").on(table.category),
    orderIdx: index("faq_order_idx").on(table.order),
    statusIdx: index("faq_status_idx").on(table.status),
  }),
)

export const sourcingRequests = pgTable(
  "sourcing_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    quantity: integer("quantity"),
    budget: decimal("budget", {
      precision: 12,
      scale: 2,
    }),
    targetLocation: varchar("target_location", {
      length: 255,
    }),
    specifications: jsonb("specifications"),
    images: jsonb("images").default([]),
    status: varchar("status", { length: 50 }).default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sourcing_request_user_idx").on(table.userId),
    statusIdx: index("sourcing_request_status_idx").on(table.status),
  }),
)

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    brevoContactId: varchar("brevo_contact_id", {
      length: 100,
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("subscriber_email_idx").on(table.email),
  }),
)

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 255 }).default("General"),
    status: varchar("status", { length: 50 }).notNull().default("open"),
    lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
    clientUnreadCount: integer("client_unread_count").notNull().default(0),
    adminUnreadCount: integer("admin_unread_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("conversations_user_idx").on(table.userId),
    lastMessageIdx: index("conversations_last_message_idx").on(
      table.lastMessageAt,
    ),
  }),
)

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderType: varchar("sender_type", { length: 20 }).notNull(),
    senderUserId: uuid("sender_user_id").references(() => users.id),
    senderName: varchar("sender_name", { length: 255 }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").default([]),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    convIdx: index("conversation_messages_conv_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  }),
)

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    priority: varchar("priority", { length: 20 }).notNull().default("normal"),
    status: varchar("status", { length: 30 }).notNull().default("open"),
    orderId: uuid("order_id").references(() => orders.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    userIdx: index("support_tickets_user_idx").on(table.userId),
    statusIdx: index("support_tickets_status_idx").on(table.status),
  }),
)

export const supportTicketMessages = pgTable(
  "support_ticket_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    senderType: varchar("sender_type", { length: 20 }).notNull(),
    senderUserId: uuid("sender_user_id").references(() => users.id),
    senderName: varchar("sender_name", { length: 255 }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    ticketIdx: index("support_ticket_messages_ticket_idx").on(
      table.ticketId,
      table.createdAt,
    ),
  }),
)

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const clientDocuments = pgTable(
  "client_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).default("general"),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    uploadedBy: varchar("uploaded_by", { length: 20 })
      .notNull()
      .default("admin"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("client_documents_user_idx").on(table.userId),
    projectIdx: index("client_documents_project_idx").on(table.projectId),
  }),
)

export const membershipEvents = pgTable(
  "membership_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    image: text("image"),
    location: varchar("location", { length: 255 }),
    eventDate: timestamp("event_date").notNull(),
    capacity: integer("capacity"),
    membershipTier: varchar("membership_tier", { length: 50 }).default("all"),
    status: varchar("status", { length: 50 }).notNull().default("published"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: index("membership_events_date_idx").on(table.eventDate),
  }),
)

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => membershipEvents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    eventIdx: index("event_rsvps_event_idx").on(table.eventId),
    userIdx: index("event_rsvps_user_idx").on(table.userId),
  }),
)

export const clientDocumentsRelations = relations(
  clientDocuments,
  ({ one }) => ({
    user: one(users, {
      fields: [clientDocuments.userId],
      references: [users.id],
    }),
    project: one(projects, {
      fields: [clientDocuments.projectId],
      references: [projects.id],
    }),
  }),
)

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("client"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("project_members_project_idx").on(table.projectId),
    userIdx: index("project_members_user_idx").on(table.userId),
  }),
)

export const projectAssets = pgTable(
  "project_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    assetType: varchar("asset_type", { length: 30 }).notNull().default("image"),
    category: varchar("category", { length: 100 }),
    fileUrl: text("file_url").notNull(),
    storageKey: text("storage_key"),
    thumbnailUrl: text("thumbnail_url"),
    fileSize: integer("file_size"),
    storageProvider: varchar("storage_provider", { length: 20 })
      .notNull()
      .default("r2"),
    version: integer("version").notNull().default(1),
    parentAssetId: uuid("parent_asset_id"),
    isCurrentVersion: boolean("is_current_version").notNull().default(true),
    visibility: varchar("visibility", { length: 20 }).notNull().default("client"),
    approvalStatus: varchar("approval_status", { length: 30 })
      .notNull()
      .default("pending"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("project_assets_project_idx").on(table.projectId),
    parentIdx: index("project_assets_parent_idx").on(table.parentAssetId),
    typeIdx: index("project_assets_type_idx").on(table.assetType),
  }),
)

export const projectVisualizations = pgTable(
  "project_visualizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    modelType: varchar("model_type", { length: 20 }).notNull().default("glb"),
    storageProvider: varchar("storage_provider", { length: 20 }).notNull().default("r2"),
    storageKey: text("storage_key").notNull(),
    thumbnailKey: text("thumbnail_key"),
    fileSize: integer("file_size"),
    version: integer("version").notNull().default(1),
    status: varchar("status", { length: 20 }).notNull().default("ready"),
    visibility: varchar("visibility", { length: 20 }).notNull().default("client"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("project_visualizations_project_idx").on(table.projectId),
    statusIdx: index("project_visualizations_status_idx").on(table.status),
    visibilityIdx: index("project_visualizations_visibility_idx").on(table.visibility),
  }),
)

export const visualizationViews = pgTable(
  "visualization_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visualizationId: uuid("visualization_id").notNull().references(() => projectVisualizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    cameraPosition: jsonb("camera_position").$type<number[]>().notNull(),
    targetPosition: jsonb("target_position").$type<number[]>().notNull(),
    zoom: decimal("zoom", { precision: 10, scale: 4 }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    visualizationIdx: index("visualization_views_visualization_idx").on(table.visualizationId),
  }),
)

export const visualizationAnnotations = pgTable(
  "visualization_annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visualizationId: uuid("visualization_id").notNull().references(() => projectVisualizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    position: jsonb("position").$type<{ x: number; y: number; z: number }>().notNull(),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    linkedProjectItemId: varchar("linked_project_item_id", { length: 120 }),
    imageKey: text("image_key"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    visualizationIdx: index("visualization_annotations_visualization_idx").on(table.visualizationId),
    statusIdx: index("visualization_annotations_status_idx").on(table.status),
  }),
)

export const projectAssetComments = pgTable(
  "project_asset_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => projectAssets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderType: varchar("sender_type", { length: 20 }).notNull().default("client"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    assetIdx: index("project_asset_comments_asset_idx").on(table.assetId),
  }),
)

export const projectDocuments = pgTable(
  "project_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).default("general"),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    storageProvider: varchar("storage_provider", { length: 20 })
      .notNull()
      .default("r2"),
    visibility: varchar("visibility", { length: 20 }).notNull().default("client"),
    signatureStatus: varchar("signature_status", { length: 20 }).default("n/a"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("project_documents_project_idx").on(table.projectId),
  }),
)

export const projectActivity = pgTable(
  "project_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    actorType: varchar("actor_type", { length: 20 }).notNull().default("admin"),
    action: varchar("action", { length: 100 }).notNull(),
    summary: text("summary").notNull(),
    relatedAssetId: uuid("related_asset_id").references(() => projectAssets.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("project_activity_project_idx").on(
      table.projectId,
      table.createdAt,
    ),
  }),
)

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}))

export const projectAssetsRelations = relations(
  projectAssets,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectAssets.projectId],
      references: [projects.id],
    }),
    uploader: one(users, {
      fields: [projectAssets.uploadedBy],
      references: [users.id],
    }),
    comments: many(projectAssetComments),
  }),
)

export const projectVisualizationsRelations = relations(projectVisualizations, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectVisualizations.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [projectVisualizations.createdBy],
    references: [users.id],
  }),
  views: many(visualizationViews),
  annotations: many(visualizationAnnotations),
}))

export const visualizationViewsRelations = relations(visualizationViews, ({ one }) => ({
  visualization: one(projectVisualizations, {
    fields: [visualizationViews.visualizationId],
    references: [projectVisualizations.id],
  }),
  creator: one(users, {
    fields: [visualizationViews.createdBy],
    references: [users.id],
  }),
}))

export const visualizationAnnotationsRelations = relations(visualizationAnnotations, ({ one }) => ({
  visualization: one(projectVisualizations, {
    fields: [visualizationAnnotations.visualizationId],
    references: [projectVisualizations.id],
  }),
  creator: one(users, {
    fields: [visualizationAnnotations.createdBy],
    references: [users.id],
  }),
}))

export const projectAssetCommentsRelations = relations(
  projectAssetComments,
  ({ one }) => ({
    asset: one(projectAssets, {
      fields: [projectAssetComments.assetId],
      references: [projectAssets.id],
    }),
    user: one(users, {
      fields: [projectAssetComments.userId],
      references: [users.id],
    }),
  }),
)

export const projectDocumentsRelations = relations(
  projectDocuments,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectDocuments.projectId],
      references: [projects.id],
    }),
  }),
)

export const quotesRelations = relations(quotes, ({ one }) => ({
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [quotes.projectId],
    references: [projects.id],
  }),
  consultation: one(consultations, {
    fields: [quotes.consultationId],
    references: [consultations.id],
  }),
}))

export const consultationsRelations = relations(consultations, ({ one, many }) => ({
  user: one(users, {
    fields: [consultations.userId],
    references: [users.id],
  }),
  slots: many(consultationSlots),
}))

export const projectActivityRelations = relations(
  projectActivity,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectActivity.projectId],
      references: [projects.id],
    }),
    asset: one(projectAssets, {
      fields: [projectActivity.relatedAssetId],
      references: [projectAssets.id],
    }),
  }),
)

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    assignedTo: varchar("assigned_to", { length: 20 }).notNull().default("client"),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("project_tasks_project_idx").on(table.projectId),
    statusIdx: index("project_tasks_status_idx").on(table.status),
  }),
)

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    items: jsonb("items"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
    tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    dueDate: timestamp("due_date"),
    status: varchar("status", { length: 50 }).notNull().default("draft"),
    pdfUrl: text("pdf_url"),
    receiptUrl: text("receipt_url"),
    receiptUploadedAt: timestamp("receipt_uploaded_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("invoices_user_idx").on(table.userId),
    projectIdx: index("invoices_project_idx").on(table.projectId),
    statusIdx: index("invoices_status_idx").on(table.status),
  }),
)

export const paymentRecords = pgTable(
  "payment_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id"),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    provider: varchar("provider", { length: 40 }).notNull().default("manual"),
    transactionReference: varchar("transaction_reference", { length: 120 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("UGX"),
    method: varchar("method", { length: 40 }),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    metadata: jsonb("metadata").default({}),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("payment_records_user_idx").on(table.userId),
    invoiceIdx: index("payment_records_invoice_idx").on(table.invoiceId),
    providerReferenceIdx: uniqueIndex("payment_records_provider_reference_idx").on(
      table.provider,
      table.transactionReference,
    ),
    statusIdx: index("payment_records_status_idx").on(table.status),
  }),
)

export const financialDocuments = pgTable(
  "financial_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentNumber: varchar("document_number", { length: 80 }).notNull().unique(),
    documentType: varchar("document_type", { length: 40 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    paymentId: uuid("payment_id").references(() => paymentRecords.id, { onDelete: "set null" }),
    status: varchar("status", { length: 30 }).notNull().default("draft"),
    amount: decimal("amount", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("UGX"),
    storageProvider: varchar("storage_provider", { length: 20 }).notNull().default("r2"),
    storageKey: text("storage_key"),
    fileUrl: text("file_url"),
    fileName: varchar("file_name", { length: 255 }),
    mimeType: varchar("mime_type", { length: 120 }),
    fileSize: integer("file_size"),
    payload: jsonb("payload").notNull().default({}),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("financial_documents_user_idx").on(table.userId),
    projectIdx: index("financial_documents_project_idx").on(table.projectId),
    typeIdx: index("financial_documents_type_idx").on(table.documentType),
    statusIdx: index("financial_documents_status_idx").on(table.status),
  }),
)

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 60 }).notNull(),
    priority: varchar("priority", { length: 20 }).notNull().default("informational"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"),
    metadata: jsonb("metadata").default({}),
    channels: jsonb("channels").notNull().default(["in_app"]),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    unreadIdx: index("notifications_unread_idx").on(table.userId, table.readAt),
    createdIdx: index("notifications_created_idx").on(table.createdAt),
  }),
)

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    preferences: jsonb("preferences").notNull().default({}),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: uniqueIndex("notification_preferences_user_idx").on(table.userId),
  }),
)

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 30 }).notNull(),
    channel: varchar("channel", { length: 20 }).notNull(),
    providerMessageId: varchar("provider_message_id", { length: 120 }),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    error: text("error"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    notificationIdx: index("notification_deliveries_notification_idx").on(table.notificationId),
    providerMessageIdx: index("notification_deliveries_provider_message_idx").on(table.providerMessageId),
  }),
)

export const consultationSlots = pgTable(
  "consultation_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startTime: timestamp("start_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(45),
    mode: varchar("mode", { length: 20 }).notNull().default("virtual"),
    isBooked: boolean("is_booked").notNull().default(false),
    consultationId: uuid("consultation_id").references(() => consultations.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    startIdx: index("consultation_slots_start_idx").on(table.startTime),
    bookedIdx: index("consultation_slots_booked_idx").on(table.isBooked),
  }),
)

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
}))

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  quote: one(quotes, {
    fields: [invoices.quoteId],
    references: [quotes.id],
  }),
}))

export const paymentRecordsRelations = relations(paymentRecords, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentRecords.userId],
    references: [users.id],
  }),
  invoice: one(invoices, {
    fields: [paymentRecords.invoiceId],
    references: [invoices.id],
  }),
  documents: many(financialDocuments),
}))

export const financialDocumentsRelations = relations(financialDocuments, ({ one }) => ({
  user: one(users, {
    relationName: 'financialDocumentsUser',
    fields: [financialDocuments.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [financialDocuments.projectId],
    references: [projects.id],
  }),
  quote: one(quotes, {
    fields: [financialDocuments.quoteId],
    references: [quotes.id],
  }),
  invoice: one(invoices, {
    fields: [financialDocuments.invoiceId],
    references: [invoices.id],
  }),
  payment: one(paymentRecords, {
    fields: [financialDocuments.paymentId],
    references: [paymentRecords.id],
  }),
  createdByUser: one(users, {
    relationName: 'financialDocumentsCreator',
    fields: [financialDocuments.createdBy],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  deliveries: many(notificationDeliveries),
}))

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}))

export const notificationDeliveriesRelations = relations(notificationDeliveries, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationDeliveries.notificationId],
    references: [notifications.id],
  }),
}))

export const consultationSlotsRelations = relations(consultationSlots, ({ one }) => ({
  consultation: one(consultations, {
    fields: [consultationSlots.consultationId],
    references: [consultations.id],
  }),
}))

export const tradeResources = pgTable("trade_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull().default("guide"),
  fileUrl: text("file_url").notNull(),
  fileSize: varchar("file_size", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("published"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const membershipEventsRelations = relations(
  membershipEvents,
  ({ many }) => ({
    rsvps: many(eventRsvps),
  }),
)

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(membershipEvents, {
    fields: [eventRsvps.eventId],
    references: [membershipEvents.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}))

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    conversationMessages: many(conversationMessages),
  }),
)

export const conversationMessagesRelations = relations(
  conversationMessages,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationMessages.conversationId],
      references: [conversations.id],
    }),
  }),
)

export const supportTicketsRelations = relations(
  supportTickets,
  ({ one, many }) => ({
    user: one(users, {
      fields: [supportTickets.userId],
      references: [users.id],
    }),
    order: one(orders, {
      fields: [supportTickets.orderId],
      references: [orders.id],
    }),
    supportTicketMessages: many(supportTicketMessages),
  }),
)

export const supportTicketMessagesRelations = relations(
  supportTicketMessages,
  ({ one }) => ({
    ticket: one(supportTickets, {
      fields: [supportTicketMessages.ticketId],
      references: [supportTickets.id],
    }),
  }),
)

export const loyaltyAccounts = pgTable(
  "loyalty_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    balancePoints: integer("balance_points").notNull().default(0),
    lifetimeEarned: integer("lifetime_earned").notNull().default(0),
    lifetimeRedeemed: integer("lifetime_redeemed").notNull().default(0),
    referralCode: varchar("referral_code", { length: 32 }).notNull().unique(),
    lastDailyClaimedAt: timestamp("last_daily_claimed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: uniqueIndex("loyalty_accounts_user_idx").on(table.userId),
    referralCodeIdx: uniqueIndex("loyalty_accounts_referral_code_idx").on(table.referralCode),
  }),
)

export const loyaltyTransactions = pgTable(
  "loyalty_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => loyaltyAccounts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    eventKey: varchar("event_key", { length: 180 }).notNull().unique(),
    description: varchar("description", { length: 255 }).notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    accountIdx: index("loyalty_transactions_account_idx").on(table.accountId, table.createdAt),
    userIdx: index("loyalty_transactions_user_idx").on(table.userId, table.createdAt),
    typeIdx: index("loyalty_transactions_type_idx").on(table.type),
    orderIdx: index("loyalty_transactions_order_idx").on(table.orderId),
    expiryIdx: index("loyalty_transactions_expiry_idx").on(table.expiresAt),
  }),
)

export const loyaltyReferrals = pgTable(
  "loyalty_referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referralCode: varchar("referral_code", { length: 32 }).notNull(),
    referrerUserId: uuid("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referredUserId: uuid("referred_user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    qualifyingOrderId: uuid("qualifying_order_id").unique().references(() => orders.id, { onDelete: "set null" }),
    rewardPoints: integer("reward_points").notNull().default(500),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    qualifiedAt: timestamp("qualified_at"),
  },
  (table) => ({
    codeIdx: index("loyalty_referrals_code_idx").on(table.referralCode),
    referrerIdx: index("loyalty_referrals_referrer_idx").on(table.referrerUserId, table.createdAt),
    statusIdx: index("loyalty_referrals_status_idx").on(table.status),
  }),
)

export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  consultations: many(consultations),
  quotes: many(quotes),
  comments: many(comments),
  likes: many(likes),
  tradeMembers: many(tradeMembers),
  memberships: many(memberships),
  sourcingRequests: many(sourcingRequests),
  carts: many(carts),
  paymentRecords: many(paymentRecords),
  financialDocuments: many(financialDocuments, { relationName: 'financialDocumentsUser' }),
  visualizations: many(projectVisualizations),
  visualizationViews: many(visualizationViews),
  visualizationAnnotations: many(visualizationAnnotations),
  createdFinancialDocuments: many(financialDocuments, { relationName: 'financialDocumentsCreator' }),
  notifications: many(notifications),
  notificationPreferences: one(notificationPreferences),
  loyaltyAccount: one(loyaltyAccounts),
  loyaltyTransactions: many(loyaltyTransactions),
  loyaltyReferralsSent: many(loyaltyReferrals, { relationName: 'loyaltyReferrer' }),
  loyaltyReferralsReceived: many(loyaltyReferrals, { relationName: 'loyaltyReferred' }),
}))

export const departmentsRelations = relations(
  departments,
  ({ many }) => ({
    categories: many(categories),
  }),
)

export const categoriesRelations = relations(
  categories,
  ({ one, many }) => ({
    department: one(departments, {
      fields: [categories.departmentId],
      references: [departments.id],
    }),
    subCategories: many(subCategories),
  }),
)

export const attributeTemplatesRelations = relations(
  attributeTemplates,
  ({ many }) => ({
    subCategories: many(subCategories),
  }),
)

export const subCategoriesRelations = relations(
  subCategories,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [subCategories.categoryId],
      references: [categories.id],
    }),
    template: one(attributeTemplates, {
      fields: [subCategories.templateId],
      references: [attributeTemplates.id],
    }),
    products: many(products),
  }),
)

export const colorLibraryRelations = relations(
  colorLibrary,
  ({ many }) => ({
    finishes: many(finishLibrary),
    fabrics: many(fabricLibrary),
    variants: many(productVariants),
  }),
)

export const materialLibraryRelations = relations(
  materialLibrary,
  ({ many }) => ({
    variants: many(productVariants),
  }),
)

export const finishLibraryRelations = relations(
  finishLibrary,
  ({ one, many }) => ({
    color: one(colorLibrary, {
      fields: [finishLibrary.colorId],
      references: [colorLibrary.id],
    }),
    variants: many(productVariants),
  }),
)

export const fabricLibraryRelations = relations(
  fabricLibrary,
  ({ one, many }) => ({
    color: one(colorLibrary, {
      fields: [fabricLibrary.colorId],
      references: [colorLibrary.id],
    }),
    variants: many(productVariants),
  }),
)

export const productsRelations = relations(
  products,
  ({ one, many }) => ({
    subCategory: one(subCategories, {
      fields: [products.subCategoryId],
      references: [subCategories.id],
    }),
    productVariants: many(productVariants),
    productImages: many(productImages),
    productReviews: many(productReviews),
  }),
)

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    color: one(colorLibrary, {
      fields: [productVariants.colorId],
      references: [colorLibrary.id],
    }),
    fabric: one(fabricLibrary, {
      fields: [productVariants.fabricId],
      references: [fabricLibrary.id],
    }),
    material: one(materialLibrary, {
      fields: [productVariants.materialId],
      references: [materialLibrary.id],
    }),
    images: many(productImages),
  }),
)

export const productImagesRelations = relations(
  productImages,
  ({ one }) => ({
    product: one(products, {
      fields: [productImages.productId],
      references: [products.id],
    }),
    variant: one(productVariants, {
      fields: [productImages.variantId],
      references: [productVariants.id],
    }),
  }),
)

export const productReviewsRelations = relations(
  productReviews,
  ({ one }) => ({
    product: one(products, {
      fields: [productReviews.productId],
      references: [products.id],
    }),
  }),
)

export const productRelationsRelations = relations(
  productRelations,
  ({ one }) => ({
    product: one(products, {
      fields: [productRelations.productId],
      references: [products.id],
      relationName: "productRelationsSource",
    }),
    relatedProduct: one(products, {
      fields: [productRelations.relatedProductId],
      references: [products.id],
      relationName: "productRelationsTarget",
    }),
  }),
)

export const productTaxonomyRulesRelations = relations(
  productTaxonomyRules,
  ({ one }) => ({
    department: one(departments, {
      fields: [productTaxonomyRules.departmentId],
      references: [departments.id],
    }),
    category: one(categories, {
      fields: [productTaxonomyRules.categoryId],
      references: [categories.id],
    }),
    subCategory: one(subCategories, {
      fields: [productTaxonomyRules.subCategoryId],
      references: [subCategories.id],
    }),
    template: one(attributeTemplates, {
      fields: [productTaxonomyRules.templateId],
      references: [attributeTemplates.id],
    }),
  }),
)

export const productAttributeDefinitionsRelations = relations(
  productAttributeDefinitions,
  ({ one }) => ({
    template: one(attributeTemplates, {
      fields: [productAttributeDefinitions.templateId],
      references: [attributeTemplates.id],
    }),
  }),
)

export const projectsRelations = relations(
  projects,
  ({ many, one }) => ({
    comments: many(comments),
    likes: many(likes),
    clientDocuments: many(clientDocuments),
    members: many(projectMembers),
    assets: many(projectAssets),
    visualizations: many(projectVisualizations),
    documents: many(projectDocuments),
    activity: many(projectActivity),
    tasks: many(projectTasks),
    quotes: many(quotes),
    invoices: many(invoices),
    user: one(users, {
      fields: [projects.userId],
      references: [users.id],
    }),
  }),
)

export const articlesRelations = relations(
  articles,
  ({ many }) => ({
    comments: many(comments),
    likes: many(likes),
  }),
)

export const serviceCategoriesRelations = relations(
  serviceCategories,
  ({ many }) => ({
    services: many(services),
  }),
)

export const servicesRelations = relations(
  services,
  ({ one, many }) => ({
    category: one(serviceCategories, {
      fields: [services.categoryId],
      references: [serviceCategories.id],
    }),
    requests: many(serviceRequests),
  }),
)

export const serviceRequestsRelations = relations(
  serviceRequests,
  ({ one }) => ({
    service: one(services, {
      fields: [serviceRequests.serviceId],
      references: [services.id],
    }),
  }),
)









export const loyaltyAccountsRelations = relations(loyaltyAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [loyaltyAccounts.userId],
    references: [users.id],
  }),
  transactions: many(loyaltyTransactions),
}))

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  account: one(loyaltyAccounts, {
    fields: [loyaltyTransactions.accountId],
    references: [loyaltyAccounts.id],
  }),
  user: one(users, {
    fields: [loyaltyTransactions.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [loyaltyTransactions.orderId],
    references: [orders.id],
  }),
}))

export const loyaltyReferralsRelations = relations(loyaltyReferrals, ({ one }) => ({
  referrer: one(users, {
    relationName: 'loyaltyReferrer',
    fields: [loyaltyReferrals.referrerUserId],
    references: [users.id],
  }),
  referred: one(users, {
    relationName: 'loyaltyReferred',
    fields: [loyaltyReferrals.referredUserId],
    references: [users.id],
  }),
  qualifyingOrder: one(orders, {
    fields: [loyaltyReferrals.qualifyingOrderId],
    references: [orders.id],
  }),
}))
