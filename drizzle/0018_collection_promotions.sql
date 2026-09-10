CREATE TABLE IF NOT EXISTS "collection_promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "code" varchar(40) NOT NULL,
  "discount_type" varchar(20) DEFAULT 'percentage' NOT NULL,
  "discount_value" numeric(12, 2) NOT NULL,
  "max_discount" numeric(12, 2),
  "collection_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "audience" varchar(30) DEFAULT 'all' NOT NULL,
  "starts_at" timestamp,
  "ends_at" timestamp,
  "total_usage_limit" integer,
  "per_customer_limit" integer DEFAULT 1 NOT NULL,
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "stackable" boolean DEFAULT false NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "collection_promotions_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "collection_promotions_code_idx" ON "collection_promotions" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_promotions_status_idx" ON "collection_promotions" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_promotions_validity_idx" ON "collection_promotions" USING btree ("starts_at", "ends_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_promotion_redemptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promotion_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "code" varchar(40) NOT NULL,
  "discount_amount" numeric(12, 2) NOT NULL,
  "status" varchar(20) DEFAULT 'reserved' NOT NULL,
  "reserved_at" timestamp DEFAULT now() NOT NULL,
  "applied_at" timestamp,
  "released_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_promotion_redemptions_promotion_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."collection_promotions"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "order_promotion_redemptions_order_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "order_promotion_redemptions_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_promotion_redemptions_order_idx" ON "order_promotion_redemptions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_promotion_redemptions_promotion_user_idx" ON "order_promotion_redemptions" USING btree ("promotion_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_promotion_redemptions_status_idx" ON "order_promotion_redemptions" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotion_id" uuid;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotion_code" varchar(40);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotion_name" varchar(160);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotion_discount" numeric(12, 2) DEFAULT '0';
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_promotion_fk') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_promotion_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."collection_promotions"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_promotion_idx" ON "orders" USING btree ("promotion_id");
--> statement-breakpoint
ALTER TABLE "collection_promotions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "order_promotion_redemptions" ENABLE ROW LEVEL SECURITY;
