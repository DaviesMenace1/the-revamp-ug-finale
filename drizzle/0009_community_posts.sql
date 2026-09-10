CREATE TABLE IF NOT EXISTS "community_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "image" text,
  "category" varchar(50) DEFAULT 'announcement' NOT NULL,
  "status" varchar(20) DEFAULT 'published' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "community_posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null
);

CREATE INDEX IF NOT EXISTS "community_posts_status_idx" ON "community_posts" USING btree ("status", "created_at");
CREATE INDEX IF NOT EXISTS "community_posts_category_idx" ON "community_posts" USING btree ("category");

ALTER TABLE "community_posts" ENABLE ROW LEVEL SECURITY;
