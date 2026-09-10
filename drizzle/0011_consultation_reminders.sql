CREATE TABLE IF NOT EXISTS "consultation_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultation_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "reminder_key" varchar(20) NOT NULL,
  "scheduled_for" timestamp NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_attempt_at" timestamp,
  "sent_at" timestamp,
  "last_error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "consultation_reminders_consultation_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "consultation_reminders_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consultation_reminders_consultation_key_idx" ON "consultation_reminders" USING btree ("consultation_id", "reminder_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_reminders_status_scheduled_idx" ON "consultation_reminders" USING btree ("status", "scheduled_for");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_reminders_user_idx" ON "consultation_reminders" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE "consultation_reminders" ENABLE ROW LEVEL SECURITY;
