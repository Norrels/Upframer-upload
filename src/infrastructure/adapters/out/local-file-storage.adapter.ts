import path from "node:path";
import fs from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  FileStoragePort,
  FileData,
} from "../../../domain/ports/file-storage.port.ts";

const pump = promisify(pipeline);

export class LocalFileStorageAdapter implements FileStoragePort {
  private readonly uploadDirectory: string;

  constructor() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    this.uploadDirectory = path.resolve(__dirname, "../../../temp");
  }

  async saveFile(fileData: FileData, filename: string): Promise<string> {
    const uploadDestination = path.resolve(this.uploadDirectory, filename);
    await pump(fileData.file, fs.createWriteStream(uploadDestination));
    return uploadDestination;
  }
}
