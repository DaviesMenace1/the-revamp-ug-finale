CREATE TABLE IF NOT EXISTS "project_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "author_type" varchar(20) DEFAULT 'client' NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "project_notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade,
  CONSTRAINT "project_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "project_notes_project_idx" ON "project_notes" USING btree ("project_id", "created_at");
CREATE INDEX IF NOT EXISTS "project_notes_user_idx" ON "project_notes" USING btree ("user_id");

ALTER TABLE "project_notes" ENABLE ROW LEVEL SECURITY;
