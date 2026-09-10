CREATE TABLE IF NOT EXISTS "program_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "program" varchar(30) NOT NULL,
  "plan_key" varchar(50) NOT NULL,
  "billing_period" varchar(20) NOT NULL,
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) DEFAULT 'UGX' NOT NULL,
  "start_date" timestamp,
  "end_date" timestamp,
  "provider" varchar(40) DEFAULT 'flutterwave' NOT NULL,
  "transaction_reference" varchar(120) NOT NULL,
  "idempotency_key" varchar(120) NOT NULL,
  "provider_charge_id" varchar(120),
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "program_subscriptions_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
ALTER TABLE "program_subscriptions" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(120);
--> statement-breakpoint
UPDATE "program_subscriptions" SET "idempotency_key" = "transaction_reference" WHERE "idempotency_key" IS NULL;
--> statement-breakpoint
ALTER TABLE "program_subscriptions" ALTER COLUMN "idempotency_key" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_subscriptions_user_program_idx" ON "program_subscriptions" USING btree ("user_id", "program");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_subscriptions_status_idx" ON "program_subscriptions" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "program_subscriptions_provider_charge_idx" ON "program_subscriptions" USING btree ("provider", "provider_charge_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "program_subscriptions_reference_idx" ON "program_subscriptions" USING btree ("provider", "transaction_reference");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "program_subscriptions_idempotency_idx" ON "program_subscriptions" USING btree ("idempotency_key");
--> statement-breakpoint
ALTER TABLE "payment_records" ADD COLUMN IF NOT EXISTS "subscription_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_records_subscription_fk'
  ) THEN
    ALTER TABLE "payment_records"
      ADD CONSTRAINT "payment_records_subscription_fk"
      FOREIGN KEY ("subscription_id") REFERENCES "public"."program_subscriptions"("id") ON DELETE SET NULL ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_records_subscription_idx" ON "payment_records" USING btree ("subscription_id");
