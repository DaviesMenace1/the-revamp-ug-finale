CREATE TABLE IF NOT EXISTS "saved_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" varchar(120) NOT NULL DEFAULT 'Home',
  "recipient_name" varchar(255) NOT NULL,
  "phone" varchar(30) NOT NULL,
  "address" text NOT NULL,
  "city" varchar(120) NOT NULL,
  "region" varchar(120),
  "country" varchar(100) NOT NULL DEFAULT 'Uganda',
  "notes" text,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_addresses_user_idx" ON "saved_addresses" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_addresses_default_idx" ON "saved_addresses" USING btree ("user_id", "is_default");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pickup_stations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(180) NOT NULL,
  "address" text NOT NULL,
  "city" varchar(120) NOT NULL DEFAULT 'Kampala',
  "region" varchar(120),
  "country" varchar(100) NOT NULL DEFAULT 'Uganda',
  "phone" varchar(30),
  "instructions" text,
  "fee" numeric(12, 2) NOT NULL DEFAULT '0',
  "latitude" numeric(10, 7),
  "longitude" numeric(10, 7),
  "active" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_stations_active_order_idx" ON "pickup_stations" USING btree ("active", "display_order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_stations_city_idx" ON "pickup_stations" USING btree ("city");
--> statement-breakpoint
INSERT INTO "pickup_stations" ("name", "address", "city", "region", "country", "instructions", "fee", "active", "display_order")
SELECT 'UN Mall, Kyanja', 'UN Mall, Kyanja, Kampala, Uganda', 'Kampala', 'Kyanja', 'Uganda', 'Bring your order confirmation and a valid ID when collecting your order.', '0', true, 0
WHERE NOT EXISTS (
  SELECT 1 FROM "pickup_stations" WHERE lower("name") = lower('UN Mall, Kyanja')
);
