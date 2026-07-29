CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('consultation_scheduled', 'design_phase', 'procurement_phase', 'installation_phase', 'completed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'designer', 'admin', 'trade_member', 'architect', 'interior_designer');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"excerpt" varchar(500),
	"author" varchar(255),
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"featured_image" text,
	"rating" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"seo_title" varchar(255),
	"seo_description" varchar(255),
	"status" varchar(50) DEFAULT 'published',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"project_id" uuid,
	"article_id" uuid,
	"content" text NOT NULL,
	"rating" integer,
	"approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"service_type" varchar(100),
	"budget" numeric(12, 2),
	"preferred_date" timestamp,
	"status" varchar(50) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"project_id" uuid,
	"article_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"membership_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"benefits" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax" numeric(12, 2) DEFAULT '0',
	"shipping" numeric(12, 2) DEFAULT '0',
	"discount" numeric(12, 2) DEFAULT '0',
	"total" numeric(12, 2) NOT NULL,
	"status" "order_status" DEFAULT 'pending',
	"payment_status" "payment_status" DEFAULT 'pending',
	"delivery_address" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"sub_category" varchar(100),
	"price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"images" jsonb DEFAULT '[]'::jsonb,
	"thumbnail_image" text,
	"in_stock" boolean DEFAULT true,
	"quantity" integer DEFAULT 0,
	"sku" varchar(100),
	"dimensions" jsonb,
	"weight" numeric(8, 2),
	"material" varchar(255),
	"color" varchar(100),
	"rating" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"seo_title" varchar(255),
	"seo_description" varchar(255),
	"status" varchar(50) DEFAULT 'published',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"client_name" varchar(255),
	"location" varchar(255),
	"budget" numeric(12, 2),
	"images" jsonb DEFAULT '[]'::jsonb,
	"thumbnail_image" text,
	"designer" varchar(255),
	"status" "project_status" DEFAULT 'consultation_scheduled',
	"rating" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"seo_title" varchar(255),
	"seo_description" varchar(255),
	"publish_status" varchar(50) DEFAULT 'published',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_number" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"consultation_id" uuid,
	"items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax" numeric(12, 2) DEFAULT '0',
	"total" numeric(12, 2) NOT NULL,
	"valid_until" timestamp,
	"status" varchar(50) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number")
);
--> statement-breakpoint
CREATE TABLE "sourcing_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"quantity" integer,
	"budget" numeric(12, 2),
	"target_location" varchar(255),
	"specifications" jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"business_category" varchar(100),
	"trade_type" varchar(100),
	"tax_number" varchar(50),
	"business_license" text,
	"certificate" text,
	"status" varchar(50) DEFAULT 'pending',
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"country" varchar(100),
	"city" varchar(100),
	"company" varchar(255),
	"role" "user_role" DEFAULT 'customer',
	"avatar" text,
	"bio" text,
	"marketing_consent" boolean DEFAULT true,
	"preferred_language" varchar(5) DEFAULT 'en',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "article_category_idx" ON "articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "article_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "article_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "comment_user_idx" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comment_product_idx" ON "comments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "comment_project_idx" ON "comments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "comment_article_idx" ON "comments" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "consultation_user_idx" ON "consultations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "consultation_status_idx" ON "consultations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "like_user_idx" ON "likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "like_product_idx" ON "likes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "like_project_idx" ON "likes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "like_article_idx" ON "likes" USING btree ("article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_product_unique" ON "likes" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_project_unique" ON "likes" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_article_unique" ON "likes" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_type_idx" ON "memberships" USING btree ("membership_type");--> statement-breakpoint
CREATE INDEX "order_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "project_category_idx" ON "projects" USING btree ("category");--> statement-breakpoint
CREATE INDEX "project_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "quote_user_idx" ON "quotes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quote_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sourcing_request_user_idx" ON "sourcing_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sourcing_request_status_idx" ON "sourcing_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trade_member_user_idx" ON "trade_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trade_member_status_idx" ON "trade_members" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "role_idx" ON "users" USING btree ("role");