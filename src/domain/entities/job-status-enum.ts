import z from "zod";

export const JobStatusEnum = z.enum(["processing", "completed", "failed"]);

export type JobStatus = z.infer<typeof JobStatusEnum>;
