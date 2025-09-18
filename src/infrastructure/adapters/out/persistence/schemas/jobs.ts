import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const jobStatus = pgEnum("job_status", [
  "processing",
  "completed",
  "failed",
]);

export const jobsTable = pgTable("jobs", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: integer().notNull(),
  jobId: varchar({ length: 255 }).notNull().unique(),
  userEmail: varchar({ length: 255 }).notNull(),
  videoPath: varchar({ length: 2048 }).notNull(),
  outputPath: varchar({ length: 2048 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  status: jobStatus("status").notNull().default("processing"),
});
