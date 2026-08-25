CREATE TABLE IF NOT EXISTS "consultation_promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "code" varchar(40),
  "discount_type" varchar(20) DEFAULT 'percentage' NOT NULL,
  "discount_value" numeric(12, 2) NOT NULL,
  "max_discount" numeric(12, 2),
  "service_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
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
  CONSTRAINT "consultation_promotions_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consultation_promotions_code_idx" ON "consultation_promotions" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_promotions_status_idx" ON "consultation_promotions" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_promotions_validity_idx" ON "consultation_promotions" USING btree ("starts_at", "ends_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consultation_payment_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultation_id" uuid,
  "slot_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "tx_ref" varchar(120) NOT NULL,
  "idempotency_key" varchar(120) NOT NULL,
  "base_amount" numeric(12, 2) NOT NULL,
  "discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
  "tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "tax_rate" numeric(6, 3) DEFAULT '0' NOT NULL,
  "currency" varchar(3) DEFAULT 'UGX' NOT NULL,
  "promotion_id" uuid,
  "promotion_code" varchar(40),
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "flutterwave_transaction_id" varchar(120),
  "payment_method" varchar(40),
  "payment_url" text,
  "expires_at" timestamp NOT NULL,
  "paid_at" timestamp,
  "failed_at" timestamp,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "consultation_payment_intents_consultation_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "consultation_payment_intents_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "consultation_payment_intents_promotion_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."consultation_promotions"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consultation_payment_intents_tx_ref_idx" ON "consultation_payment_intents" USING btree ("tx_ref");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consultation_payment_intents_idempotency_idx" ON "consultation_payment_intents" USING btree ("idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_payment_intents_user_idx" ON "consultation_payment_intents" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_payment_intents_slot_idx" ON "consultation_payment_intents" USING btree ("slot_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_payment_intents_status_expiry_idx" ON "consultation_payment_intents" USING btree ("status", "expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_payment_intents_consultation_idx" ON "consultation_payment_intents" USING btree ("consultation_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consultation_promotion_redemptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promotion_id" uuid NOT NULL,
  "payment_intent_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "code" varchar(40),
  "discount_amount" numeric(12, 2) NOT NULL,
  "status" varchar(20) DEFAULT 'reserved' NOT NULL,
  "reserved_at" timestamp DEFAULT now() NOT NULL,
  "applied_at" timestamp,
  "released_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "consultation_promotion_redemptions_promotion_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."consultation_promotions"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "consultation_promotion_redemptions_payment_intent_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."consultation_payment_intents"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "consultation_promotion_redemptions_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consultation_promotion_redemptions_intent_idx" ON "consultation_promotion_redemptions" USING btree ("payment_intent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_promotion_redemptions_promotion_user_idx" ON "consultation_promotion_redemptions" USING btree ("promotion_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_promotion_redemptions_status_idx" ON "consultation_promotion_redemptions" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "consultation_promotions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "consultation_payment_intents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "consultation_promotion_redemptions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "consultation_id" uuid;
--> statement-breakpoint
ALTER TABLE "payment_records" ADD COLUMN IF NOT EXISTS "consultation_id" uuid;
--> statement-breakpoint
ALTER TABLE "financial_documents" ADD COLUMN IF NOT EXISTS "consultation_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_consultation_fk') THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_consultation_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_records_consultation_fk') THEN
    ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_consultation_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_documents_consultation_fk') THEN
    ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_consultation_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_consultation_idx" ON "invoices" USING btree ("consultation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_records_consultation_idx" ON "payment_records" USING btree ("consultation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_documents_consultation_idx" ON "financial_documents" USING btree ("consultation_id");
--> statement-breakpoint
ALTER TABLE "consultation_slots" ADD COLUMN IF NOT EXISTS "hold_until" timestamp;
--> statement-breakpoint
ALTER TABLE "consultation_slots" ADD COLUMN IF NOT EXISTS "hold_user_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultation_slots_hold_user_fk') THEN
    ALTER TABLE "consultation_slots" ADD CONSTRAINT "consultation_slots_hold_user_fk" FOREIGN KEY ("hold_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_slots_hold_idx" ON "consultation_slots" USING btree ("hold_until");
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "payment_status" varchar(30) DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "payment_amount" numeric(12, 2);
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "payment_currency" varchar(3) DEFAULT 'UGX';
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "payment_reference" varchar(120);
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "base_fee" numeric(12, 2);
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2) DEFAULT '0';
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "tax_amount" numeric(12, 2) DEFAULT '0';
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "promotion_code" varchar(40);
