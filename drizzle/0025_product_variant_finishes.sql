ALTER TYPE "variant_type" ADD VALUE IF NOT EXISTS 'FINISH';
--> statement-breakpoint
ALTER TABLE "product_variants"
  ADD COLUMN IF NOT EXISTS "finish_id" uuid REFERENCES "finish_library"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_finish_idx" ON "product_variants" ("finish_id");
