import path from "node:path";

export class VideoName {
  private readonly value: string;

  constructor(originalName: string, id: string) {
    this.validateName(originalName);
    this.value = this.generateUniqueName(originalName, id);
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Video name cannot be empty");
    }

    const extension = path.extname(name).toLowerCase();
    if (extension !== ".mp4") {
      throw new Error("Invalid file type. Only MP4 videos are allowed.");
    }
  }

  private generateUniqueName(originalName: string, id: string): string {
    const fileBaseName = path.basename(originalName);
    const extension = path.extname(originalName);
    return `${fileBaseName}-${id}${extension}`;
  }

  getValue(): string {
    return this.value;
  }
}
