import { z } from "zod";

export const JobCreationgMessageSchema = z.object({
  jobId: z.string(),
  videoName: z.string(),
  videoPath: z.string(),
});

export type JobCreationgMessage = z.infer<typeof JobCreationgMessageSchema>;
