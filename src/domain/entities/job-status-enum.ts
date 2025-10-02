import z from "zod";
import { jobStatus } from "../../infrastructure/adapters/out/persistence/schemas/jobs";

export const JobStatusEnum = z.enum(["processing", "completed", "failed"]);

export type JobStatus = z.infer<typeof JobStatusEnum>;
