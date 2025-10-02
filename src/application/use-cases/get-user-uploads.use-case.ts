import { JobRepository } from "../../domain/ports/out/persistence/job-repository";

export interface GetUserUploadsRequest {
  userId: string;
}

export interface UserUploadResponse {
  jobId: string;
  createdAt: Date;
  outputPath: string;
  status: string;
}

export interface GetUserUploadsResponse {
  success: boolean;
  uploads?: UserUploadResponse[];
  error?: string;
}

export interface GetUserUploadsPort {
  execute(request: GetUserUploadsRequest): Promise<GetUserUploadsResponse>;
}

export class GetUserUploadsUseCase implements GetUserUploadsPort {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(
    request: GetUserUploadsRequest
  ): Promise<GetUserUploadsResponse> {
    try {
      const userId = parseInt(request.userId);

      if (isNaN(userId)) {
        return {
          success: false,
          error: "Invalid user ID",
        };
      }

      const jobs = await this.jobRepository.findJobsByUserId(userId);

      const uploads: UserUploadResponse[] = jobs.map((job) => ({
        jobId: job.id,
        createdAt: job.createdAt,
        outputPath: job.outputPath,
        status: job.status,
      }));

      return {
        success: true,
        uploads,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get user uploads",
      };
    }
  }
}
