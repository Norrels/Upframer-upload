export interface UploadVideoRequest {
  filename: string;
  file: NodeJS.ReadableStream;
}

export interface UploadVideoResponse {
  success: boolean;
  videoId?: string;
  filename?: string;
  error?: string;
}

export interface UploadVideoPort {
  execute(request: UploadVideoRequest): Promise<UploadVideoResponse>;
}