CREATE UNIQUE INDEX IF NOT EXISTS "event_rsvps_event_user_unique" ON "event_rsvps" USING btree ("event_id", "user_id");
