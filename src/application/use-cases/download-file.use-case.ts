import { JobRepository } from "../../domain/ports/out/persistence/job-repository";
import { FileStoragePort } from "../../domain/ports/out/storage/file-storage.port";

export interface DownloadFileRequest {
  jobId: string;
  userId: string;
}

export interface DownloadFileResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

export interface DownloadFilePort {
  execute(request: DownloadFileRequest): Promise<DownloadFileResponse>;
}

export class DownloadFileUseCase implements DownloadFilePort {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly fileStorage: FileStoragePort
  ) {}

  async execute(request: DownloadFileRequest): Promise<DownloadFileResponse> {
    try {
      const job = await this.jobRepository.findJobById(request.jobId);

      if (!job) {
        return {
          success: false,
          error: "Job not found",
        };
      }

      if (job.userId !== request.userId) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      if (job.status !== "completed") {
        return {
          success: false,
          error: "Job is not completed yet",
        };
      }

      if (!job.outputPath) {
        return {
          success: false,
          error: "Output file not available",
        };
      }

      let downloadUrl = job.outputPath;

      if (this.fileStorage.getPresignedUrl) {
        downloadUrl = await this.fileStorage.getPresignedUrl(
          job.outputPath,
          3600
        );
      }

      return {
        success: true,
        downloadUrl,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to download file",
      };
    }
  }
}
