import z from "zod";

export const UpdatedStatusMessageSchema = z.object({
  status: z.enum(["completed", "failed"]),
  outputPath: z.string().optional(),
  jobId: z.string(),
});
