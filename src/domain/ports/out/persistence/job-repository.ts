import { JobEntity } from "../../../entities/job-entity";
import { JobStatus } from "../../../entities/job-status-enum";
import { VideoJobData } from "../../../entities/video-job-data";

export interface JobRepository {
  findJobById(jobId: string): Promise<VideoJobData | null>;
  saveJob(jobData: JobEntity): Promise<void>;
  updateJob(id: string, status: JobStatus, outputPath?: string): Promise<void>;
  findJobsByUserId(userId: number): Promise<VideoJobData[]>;
  getUserEmailByJobId(jobId: string): Promise<string | null>;
}
