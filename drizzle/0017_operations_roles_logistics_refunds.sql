ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'logistics_coordinator';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'support_agent';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'finance_viewer';

DO $$ BEGIN
  CREATE TYPE "shipment_status" AS ENUM (
    'awaiting_payment',
    'processing',
    'packed',
    'assigned',
    'out_for_delivery',
    'ready_for_pickup',
    'delivered',
    'collected',
    'exception',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "refund_status" AS ENUM (
    'not_requested',
    'requested',
    'processing',
    'completed',
    'failed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "payment_mode" varchar(30) NOT NULL DEFAULT 'pay_now',
  ADD COLUMN IF NOT EXISTS "payment_method" varchar(40),
  ADD COLUMN IF NOT EXISTS "cancellation_reason" text,
  ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp,
  ADD COLUMN IF NOT EXISTS "refund_status" "refund_status" NOT NULL DEFAULT 'not_requested';

CREATE INDEX IF NOT EXISTS "order_payment_mode_idx" ON "orders" ("payment_mode");
CREATE INDEX IF NOT EXISTS "order_refund_status_idx" ON "orders" ("refund_status");

CREATE TABLE IF NOT EXISTS "order_shipments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL UNIQUE REFERENCES "orders"("id") ON DELETE CASCADE,
  "tracking_code" varchar(80) NOT NULL UNIQUE,
  "status" "shipment_status" NOT NULL DEFAULT 'awaiting_payment',
  "assigned_to" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "assigned_at" timestamp,
  "estimated_delivery_at" timestamp,
  "dispatched_at" timestamp,
  "delivered_at" timestamp,
  "last_note" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "order_shipments_order_idx" ON "order_shipments" ("order_id");
CREATE INDEX IF NOT EXISTS "order_shipments_status_idx" ON "order_shipments" ("status");
CREATE INDEX IF NOT EXISTS "order_shipments_assigned_idx" ON "order_shipments" ("assigned_to");
CREATE UNIQUE INDEX IF NOT EXISTS "order_shipments_tracking_code_idx" ON "order_shipments" ("tracking_code");

CREATE TABLE IF NOT EXISTS "order_tracking_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "shipment_id" uuid NOT NULL REFERENCES "order_shipments"("id") ON DELETE CASCADE,
  "status" "shipment_status" NOT NULL,
  "note" text,
  "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "customer_visible" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "order_tracking_events_order_idx" ON "order_tracking_events" ("order_id", "created_at");
CREATE INDEX IF NOT EXISTS "order_tracking_events_shipment_idx" ON "order_tracking_events" ("shipment_id", "created_at");

CREATE TABLE IF NOT EXISTS "refund_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "payment_record_id" uuid REFERENCES "payment_records"("id") ON DELETE SET NULL,
  "requested_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'UGX',
  "reason" text NOT NULL,
  "status" "refund_status" NOT NULL DEFAULT 'requested',
  "provider_refund_id" varchar(120),
  "provider_status" varchar(40),
  "review_note" text,
  "processed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "refund_requests_order_idx" ON "refund_requests" ("order_id");
CREATE INDEX IF NOT EXISTS "refund_requests_status_idx" ON "refund_requests" ("status");
CREATE INDEX IF NOT EXISTS "refund_requests_payment_idx" ON "refund_requests" ("payment_record_id");
