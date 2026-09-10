ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "customization_enabled" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "customization_heading" varchar(160);
--> statement-breakpoint
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "customization_description" text;
--> statement-breakpoint
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "customization_lead_time" varchar(120);
--> statement-breakpoint
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "customization_request_label" varchar(120);
