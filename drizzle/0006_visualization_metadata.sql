CREATE TABLE IF NOT EXISTS "project_visualizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "model_type" varchar(20) DEFAULT 'glb' NOT NULL,
  "storage_provider" varchar(20) DEFAULT 'r2' NOT NULL,
  "storage_key" text NOT NULL,
  "thumbnail_key" text,
  "file_size" integer,
  "version" integer DEFAULT 1 NOT NULL,
  "status" varchar(20) DEFAULT 'ready' NOT NULL,
  "visibility" varchar(20) DEFAULT 'client' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "project_visualizations_project_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "project_visualizations_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_visualizations_project_idx" ON "project_visualizations" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_visualizations_status_idx" ON "project_visualizations" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_visualizations_visibility_idx" ON "project_visualizations" USING btree ("visibility");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visualization_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "visualization_id" uuid NOT NULL,
  "name" varchar(120) NOT NULL,
  "camera_position" jsonb NOT NULL,
  "target_position" jsonb NOT NULL,
  "zoom" numeric(10, 4),
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "visualization_views_visualization_fk" FOREIGN KEY ("visualization_id") REFERENCES "public"."project_visualizations"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "visualization_views_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visualization_views_visualization_idx" ON "visualization_views" USING btree ("visualization_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visualization_annotations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "visualization_id" uuid NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "position" jsonb NOT NULL,
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "linked_project_item_id" varchar(120),
  "image_key" text,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "visualization_annotations_visualization_fk" FOREIGN KEY ("visualization_id") REFERENCES "public"."project_visualizations"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "visualization_annotations_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visualization_annotations_visualization_idx" ON "visualization_annotations" USING btree ("visualization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visualization_annotations_status_idx" ON "visualization_annotations" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "project_visualizations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "visualization_views" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "visualization_annotations" ENABLE ROW LEVEL SECURITY;
