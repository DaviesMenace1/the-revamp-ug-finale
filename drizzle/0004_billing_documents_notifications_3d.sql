ALTER TABLE "project_assets" ADD COLUMN IF NOT EXISTS "storage_key" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "order_id" uuid,
  "invoice_id" uuid,
  "provider" varchar(40) DEFAULT 'manual' NOT NULL,
  "transaction_reference" varchar(120) NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) DEFAULT 'UGX' NOT NULL,
  "method" varchar(40),
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "paid_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_records_user_idx" ON "payment_records" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_records_invoice_idx" ON "payment_records" USING btree ("invoice_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_records_provider_reference_idx" ON "payment_records" USING btree ("provider", "transaction_reference");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_records_status_idx" ON "payment_records" USING btree ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_number" varchar(80) NOT NULL,
  "document_type" varchar(40) NOT NULL,
  "user_id" uuid NOT NULL,
  "project_id" uuid,
  "quote_id" uuid,
  "invoice_id" uuid,
  "payment_id" uuid,
  "status" varchar(30) DEFAULT 'draft' NOT NULL,
  "amount" numeric(12, 2),
  "currency" varchar(3) DEFAULT 'UGX' NOT NULL,
  "storage_provider" varchar(20) DEFAULT 'r2' NOT NULL,
  "storage_key" text,
  "file_url" text,
  "file_name" varchar(255),
  "mime_type" varchar(120),
  "file_size" integer,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "financial_documents_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_payment_id_payment_records_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment_records"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_documents_user_idx" ON "financial_documents" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_documents_project_idx" ON "financial_documents" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_documents_type_idx" ON "financial_documents" USING btree ("document_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_documents_status_idx" ON "financial_documents" USING btree ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "type" varchar(60) NOT NULL,
  "priority" varchar(20) DEFAULT 'informational' NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "action_url" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "channels" jsonb DEFAULT '["in_app"]'::jsonb NOT NULL,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_unread_idx" ON "notifications" USING btree ("user_id", "read_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_idx" ON "notifications" USING btree ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_idx" ON "notification_preferences" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "notification_id" uuid NOT NULL,
  "provider" varchar(30) NOT NULL,
  "channel" varchar(20) NOT NULL,
  "provider_message_id" varchar(120),
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "error" text,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_deliveries_notification_idx" ON "notification_deliveries" USING btree ("notification_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_deliveries_provider_message_idx" ON "notification_deliveries" USING btree ("provider_message_id");
