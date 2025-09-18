import z from "zod";

export const JobEntitySchema = z.object({
  userId: z.number().int().positive(),
  userEmail: z.email(),
  videoPath: z.url(),
  videoName: z.string(),
  jobId: z.string(),
});

export type JobEntity = z.infer<typeof JobEntitySchema>;
