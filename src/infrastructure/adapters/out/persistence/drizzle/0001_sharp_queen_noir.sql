ALTER TABLE "jobs" ADD COLUMN "videoPath" varchar(2048) NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "videoUrl";