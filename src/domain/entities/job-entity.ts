import z from "zod";

export const JobCreatedMessageSchema = z.object({
  userId: z.number().int().positive(),
  userEmail: z.email(),
  videoUrl: z.url(),
  videoName: z.string(),
  jobId: z.string(),
});

export type JobCreatedMessage = z.infer<typeof JobCreatedMessageSchema>;
