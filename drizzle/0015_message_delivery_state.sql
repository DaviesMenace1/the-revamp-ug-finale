ALTER TABLE "conversation_messages"
  ADD COLUMN IF NOT EXISTS "delivered_at" timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_messages_delivery_idx" ON "conversation_messages" USING btree ("conversation_id", "delivered_at", "read_at");
