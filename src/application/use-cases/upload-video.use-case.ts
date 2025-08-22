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

import { MessageQueuePort } from "../../domain/ports/message-queue.port.ts";
import { VideoJob } from "../../domain/entities/videoJob.ts";

export class UploadVideoUseCase implements UploadVideoPort {
  constructor(
    private readonly fileStorage: FileStoragePort,
    private readonly messageQueue: MessageQueuePort
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

      const videoJob: VideoJob = {
        jobId: videoId.getValue(),
        videoUrl: video.getFileName(),
        outputPath: fileOutput,
        retries: 0,
      };

      await this.messageQueue.sendMessage("video-job-queue", videoJob);

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
