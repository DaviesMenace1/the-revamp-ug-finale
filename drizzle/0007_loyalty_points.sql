CREATE TABLE IF NOT EXISTS "loyalty_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE,
  "balance_points" integer DEFAULT 0 NOT NULL,
  "lifetime_earned" integer DEFAULT 0 NOT NULL,
  "lifetime_redeemed" integer DEFAULT 0 NOT NULL,
  "referral_code" varchar(32) NOT NULL UNIQUE,
  "last_daily_claimed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "loyalty_accounts_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_accounts_user_idx" ON "loyalty_accounts" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_accounts_referral_code_idx" ON "loyalty_accounts" USING btree ("referral_code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "points" integer NOT NULL,
  "type" varchar(50) NOT NULL,
  "event_key" varchar(180) NOT NULL UNIQUE,
  "description" varchar(255) NOT NULL,
  "order_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "loyalty_transactions_account_fk" FOREIGN KEY ("account_id") REFERENCES "public"."loyalty_accounts"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "loyalty_transactions_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "loyalty_transactions_order_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_transactions_event_key_idx" ON "loyalty_transactions" USING btree ("event_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_transactions_account_idx" ON "loyalty_transactions" USING btree ("account_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_transactions_user_idx" ON "loyalty_transactions" USING btree ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_transactions_type_idx" ON "loyalty_transactions" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_transactions_order_idx" ON "loyalty_transactions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_transactions_expiry_idx" ON "loyalty_transactions" USING btree ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_referrals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "referral_code" varchar(32) NOT NULL,
  "referrer_user_id" uuid NOT NULL,
  "referred_user_id" uuid NOT NULL UNIQUE,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "qualifying_order_id" uuid UNIQUE,
  "reward_points" integer DEFAULT 500 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "qualified_at" timestamp,
  CONSTRAINT "loyalty_referrals_referrer_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "loyalty_referrals_referred_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "loyalty_referrals_order_fk" FOREIGN KEY ("qualifying_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_referrals_code_idx" ON "loyalty_referrals" USING btree ("referral_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_referrals_referrer_idx" ON "loyalty_referrals" USING btree ("referrer_user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_referrals_status_idx" ON "loyalty_referrals" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "loyalty_accounts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "loyalty_referrals" ENABLE ROW LEVEL SECURITY;
