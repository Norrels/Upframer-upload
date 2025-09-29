export interface UploadVideoRequest {
  filename: string;
  file: NodeJS.ReadableStream;
  userId: string;
  userEmail: string;
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