export interface FileData {
  filename: string;
  file: NodeJS.ReadableStream;
}

export interface FileStoragePort {
  saveFile(fileData: FileData, filename: string): Promise<string>;
}
