DO $$ BEGIN
 CREATE TYPE "cohort_status" AS ENUM('active', 'paused', 'at-risk', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"status" "cohort_status" DEFAULT 'active' NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"engagement_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
