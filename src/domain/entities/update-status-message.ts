import z from "zod";

export const UpdatedStatusMessageSchema = z.object({
  dateFinished: z.string(),
  status: z.enum(["completed", "failed"]),
  videoUrl: z.url().optional(),
  outputPath: z.string().optional(),
  id: z.string(),
});
