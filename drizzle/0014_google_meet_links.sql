ALTER TABLE "consultation_slots"
  ADD COLUMN IF NOT EXISTS "location" varchar(255),
  ADD COLUMN IF NOT EXISTS "meeting_provider" varchar(30),
  ADD COLUMN IF NOT EXISTS "meeting_url" text,
  ADD COLUMN IF NOT EXISTS "calendar_event_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "membership_events"
  ADD COLUMN IF NOT EXISTS "meeting_provider" varchar(30),
  ADD COLUMN IF NOT EXISTS "meeting_url" text,
  ADD COLUMN IF NOT EXISTS "calendar_event_id" varchar(255);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consultation_slots_meeting_provider_idx" ON "consultation_slots" USING btree ("meeting_provider");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_events_meeting_provider_idx" ON "membership_events" USING btree ("meeting_provider");
