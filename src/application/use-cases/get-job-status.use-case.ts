import { JobRepository } from "../../domain/ports/out/persistence/job-repository";

export interface GetJobStatusRequest {
  jobId: string;
  userId: string;
}

export interface JobStatusResponse {
  jobId: string;
  createdAt: Date;
  videoUrl: string;
  status: string;
}

export interface GetJobStatusResponse {
  success: boolean;
  job?: JobStatusResponse;
  error?: string;
}

export interface GetJobStatusPort {
  execute(request: GetJobStatusRequest): Promise<GetJobStatusResponse>;
}

export class GetJobStatusUseCase implements GetJobStatusPort {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(request: GetJobStatusRequest): Promise<GetJobStatusResponse> {
    try {
      const job = await this.jobRepository.findJobById(request.jobId);

      if (!job) {
        return {
          success: false,
          error: "Job not found"
        };
      }

      const jobData: JobStatusResponse = {
        jobId: job.id,
        createdAt: job.createdAt,
        videoUrl: job.outputPath || job.videoUrl,
        status: job.status
      };

      return {
        success: true,
        job: jobData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get job status"
      };
    }
  }
}