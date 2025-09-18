import { Video } from "../../domain/entities/video.ts";
import { VideoId } from "../../domain/value-objects/video-id.ts";
import { VideoName } from "../../domain/value-objects/video-name.ts";
import {
  FileStoragePort,
  FileData,
} from "../../domain/ports/out/storage/file-storage.port.ts";
import {
  UploadVideoPort,
  UploadVideoRequest,
  UploadVideoResponse,
} from "../../domain/ports/upload-video.port.ts";

import { QueueProcessorPort } from "../../domain/ports/out/queue/queue-processor.port.ts";
import { JobCreationgMessageSchema } from "../../domain/entities/job-creation-message.ts";
import { JobRepository } from "../../domain/ports/out/persistence/job-repository.ts";
import { JobEntity } from "../../domain/entities/job-entity.ts";
import { config } from "../../../env.ts";

export class UploadVideoUseCase implements UploadVideoPort {
  constructor(
    private readonly fileStorage: FileStoragePort,
    private readonly messageQueue: QueueProcessorPort,
    private readonly repository: JobRepository
  ) {}

  async execute(request: UploadVideoRequest): Promise<UploadVideoResponse> {
    try {
      const videoId = new VideoId();
      const videoName = new VideoName(request.filename, videoId.getValue());

      const video = new Video(videoId, videoName);

      const fileData: FileData = {
        filename: request.filename,
        file: request.file,
      };

      const fileOutput = await this.fileStorage.saveFile(
        fileData,
        video.getFileName()
      );

      console.log("File saved at:", fileOutput);

      const jobEntity: JobEntity = {
        userId: 1,
        userEmail: "matheus@gmail.com",
        jobId: videoId.getValue(),
        videoName: video.getFileName(),
        videoPath: fileOutput,
      };

      const jobMessage = JobCreationgMessageSchema.parse(jobEntity);

      await this.repository.saveJob(jobEntity);

      console.log("Salvou");

      await this.messageQueue.despatchCreatedMessage(
        config.RABBITMQ_QUEUE_CREATED,
        jobMessage
      );

      console.log("Enviou para fila");

      return {
        success: true,
        videoId: videoId.getValue(),
        filename: video.getFileName(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }
}
