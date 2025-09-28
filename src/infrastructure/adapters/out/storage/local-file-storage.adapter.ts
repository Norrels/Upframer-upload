import path from "node:path";
import fs from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import {
  FileData,
  FileStoragePort,
} from "../../../../domain/ports/out/storage/file-storage.port";

const pump = promisify(pipeline);

export class LocalFileStorageAdapter implements FileStoragePort {
  private readonly uploadDirectory: string;

  constructor() {
    this.uploadDirectory = path.resolve(__dirname, "../../../../../temp");
  }

  async saveFile(fileData: FileData, filename: string): Promise<string> {
    const uploadDestination = path.resolve(this.uploadDirectory, filename);
    await pump(fileData.file, fs.createWriteStream(uploadDestination));
    console.log("File saved to", uploadDestination);
    return uploadDestination;
  }
}
