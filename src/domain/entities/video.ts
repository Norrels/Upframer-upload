import { VideoId } from "../value-objects/video-id.ts";
import { VideoName } from "../value-objects/video-name.ts";

export class Video {
  constructor(
    private readonly id: VideoId,
    private readonly name: VideoName,
    private readonly uploadDate: Date = new Date()
  ) {}

  getId(): VideoId {
    return this.id;
  }

  getName(): VideoName {
    return this.name;
  }

  getUploadDate(): Date {
    return this.uploadDate;
  }

  getFileName(): string {
    return this.name.getValue();
  }
}