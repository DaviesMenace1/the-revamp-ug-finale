ALTER TABLE "collection_promotions" ADD COLUMN IF NOT EXISTS "target_type" varchar(20) DEFAULT 'all' NOT NULL;
--> statement-breakpoint
UPDATE "collection_promotions"
SET "target_type" = CASE
  WHEN jsonb_array_length(CASE WHEN jsonb_typeof(COALESCE("product_ids", '[]'::jsonb)) = 'array' THEN COALESCE("product_ids", '[]'::jsonb) ELSE '[]'::jsonb END) > 0
    AND jsonb_array_length(CASE WHEN jsonb_typeof(COALESCE("collection_slugs", '[]'::jsonb)) = 'array' THEN COALESCE("collection_slugs", '[]'::jsonb) ELSE '[]'::jsonb END) > 0 THEN 'mixed'
  WHEN jsonb_array_length(CASE WHEN jsonb_typeof(COALESCE("product_ids", '[]'::jsonb)) = 'array' THEN COALESCE("product_ids", '[]'::jsonb) ELSE '[]'::jsonb END) > 0 THEN 'product'
  WHEN jsonb_array_length(CASE WHEN jsonb_typeof(COALESCE("collection_slugs", '[]'::jsonb)) = 'array' THEN COALESCE("collection_slugs", '[]'::jsonb) ELSE '[]'::jsonb END) > 0 THEN 'collection'
  ELSE 'all'
END
WHERE "target_type" = 'all';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_promotions_target_type_idx" ON "collection_promotions" USING btree ("target_type");
