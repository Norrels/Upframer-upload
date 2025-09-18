CREATE TYPE "public"."job_status" AS ENUM('processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"jobId" varchar(255) NOT NULL,
	"userEmail" varchar(255) NOT NULL,
	"videoUrl" varchar(2048) NOT NULL,
	"outputPath" varchar(2048),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" "job_status" DEFAULT 'processing' NOT NULL,
	CONSTRAINT "jobs_jobId_unique" UNIQUE("jobId")
);
