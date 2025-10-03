import { eq } from "drizzle-orm";
import { JobRepository } from "../../../../domain/ports/out/persistence/job-repository";
import { VideoJobData } from "../../../../domain/entities/video-job-data";
import { db } from "./index";
import { jobsTable } from "./schemas/jobs";
import { JobStatus } from "../../../../domain/entities/job-status-enum";
import { JobEntity } from "../../../../domain/entities/job-entity";

export class JobRepositoryDrizzle implements JobRepository {
  async findJobById(jobId: string): Promise<VideoJobData | null> {
    const result = await db
      .select({
        id: jobsTable.jobId,
        videoUrl: jobsTable.videoPath,
        outputPath: jobsTable.outputPath,
        status: jobsTable.status,
        createdAt: jobsTable.createdAt,
        userId: jobsTable.userId,
      })
      .from(jobsTable)
      .where(eq(jobsTable.jobId, jobId))
      .limit(1);

    if (result.length === 0) return null;
    return result[0] as VideoJobData;
  }

  async updateJob(
    id: string,
    status: JobStatus,
    outputPath?: string
  ): Promise<void> {
    console.log(status);
    await db
      .update(jobsTable)
      .set({ status: status, outputPath: outputPath, updatedAt: new Date() })
      .where(eq(jobsTable.jobId, id));
  }

  async saveJob(jobData: JobEntity): Promise<void> {
    await db.insert(jobsTable).values(jobData);
  }

  async findJobsByUserId(userId: string): Promise<VideoJobData[]> {
    const results = await db
      .select({
        id: jobsTable.jobId,
        videoUrl: jobsTable.videoPath,
        outputPath: jobsTable.outputPath,
        status: jobsTable.status,
        createdAt: jobsTable.createdAt,
        userId: jobsTable.userId,
      })
      .from(jobsTable)
      .where(eq(jobsTable.userId, userId));

    return results as VideoJobData[];
  }

  async getUserEmailByJobId(jobId: string): Promise<string | null> {
    const result = await db
      .select({
        userEmail: jobsTable.userEmail,
      })
      .from(jobsTable)
      .where(eq(jobsTable.jobId, jobId))
      .limit(1);

    if (result.length === 0) return null;
    return result[0]?.userEmail || null;
  }
}
