import { JobCreationgMessage } from "../../../entities/job-creation-message";
import { JobStatus } from "../../../entities/job-status-enum";
import { VideoJobData } from "../../../entities/video-job-data";

export interface JobRepository {
  findJobById(jobId: string): Promise<VideoJobData | null>;
  saveJob(jobData: JobCreationgMessage): Promise<void>;
  updateJob(id: string, status: JobStatus): Promise<void>;
  findJobsByUserId(userId: number): Promise<VideoJobData[]>;
}
