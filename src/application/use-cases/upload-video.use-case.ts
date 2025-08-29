import { Video } from "../../domain/entities/video.ts";
import { VideoId } from "../../domain/value-objects/video-id.ts";
import { VideoName } from "../../domain/value-objects/video-name.ts";
import {
  FileStoragePort,
  FileData,
} from "../../domain/ports/file-storage.port.ts";
import {
  UploadVideoPort,
  UploadVideoRequest,
  UploadVideoResponse,
} from "../../domain/ports/upload-video.port.ts";

import { QueueProcessorPort } from "../../domain/ports/out/queue/queue-processor.port.ts";
import { JobCreationgMessage } from "../../domain/entities/job-creation-message.ts";

export class UploadVideoUseCase implements UploadVideoPort {
  constructor(
    private readonly fileStorage: FileStoragePort,
    private readonly messageQueue: QueueProcessorPort
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

      const job: JobCreationgMessage = {
        jobId: videoId.getValue(),
        videoPath: fileOutput,
        videoName: video.getFileName(),
      };

      await this.messageQueue.despatchCreatedMessage("video-job-queue", job);

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
