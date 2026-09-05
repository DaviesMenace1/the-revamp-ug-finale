ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "trade_discount_percent" numeric(5, 2) NOT NULL DEFAULT '0';
--> statement-breakpoint
ALTER TABLE "products"
  DROP CONSTRAINT IF EXISTS "products_trade_discount_percent_range";
--> statement-breakpoint
ALTER TABLE "products"
  ADD CONSTRAINT "products_trade_discount_percent_range"
  CHECK ("trade_discount_percent" >= 0 AND "trade_discount_percent" <= 100);
