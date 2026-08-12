CREATE TYPE "public"."variant_type" AS ENUM('COLOR', 'FABRIC');--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"color_id" uuid,
	"url" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "variant_type" NOT NULL,
	"label" varchar(100) NOT NULL,
	"value" varchar(100),
	"price_delta" numeric(10, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_color_id_product_variants_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "image_color_idx" ON "product_images" USING btree ("color_id");--> statement-breakpoint
CREATE INDEX "variant_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "variant_type_idx" ON "product_variants" USING btree ("type");