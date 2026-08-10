CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(100) NOT NULL,
	"question" varchar(500) NOT NULL,
	"answer" text NOT NULL,
	"order" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"helpful" integer DEFAULT 0,
	"not_helpful" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'published',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"image" text,
	"order" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'published',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"service_id" uuid,
	"service_type" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"company" varchar(255),
	"budget" varchar(100),
	"timeline" varchar(100),
	"project_description" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"long_description" text,
	"icon" varchar(100),
	"image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb,
	"order" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"seo_title" varchar(255),
	"seo_description" varchar(255),
	"og_image" text,
	"status" varchar(50) DEFAULT 'published',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"brevo_contact_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "sub_category" varchar(100);--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "gallery" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "og_image" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "related_articles" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "long_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gallery" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "og_image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "related_products" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "long_description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sub_category" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "gallery" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "og_image" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "related_projects" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "faq_category_idx" ON "faqs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "faq_order_idx" ON "faqs" USING btree ("order");--> statement-breakpoint
CREATE INDEX "faq_status_idx" ON "faqs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "service_category_slug_idx" ON "service_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "service_category_status_idx" ON "service_categories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_category_order_idx" ON "service_categories" USING btree ("order");--> statement-breakpoint
CREATE INDEX "service_request_user_idx" ON "service_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "service_request_service_idx" ON "service_requests" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "service_request_status_idx" ON "service_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_category_id_idx" ON "services" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "service_status_idx" ON "services" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_order_idx" ON "services" USING btree ("order");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriber_email_idx" ON "subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "article_featured_idx" ON "articles" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "product_featured_idx" ON "products" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "project_featured_idx" ON "projects" USING btree ("featured");