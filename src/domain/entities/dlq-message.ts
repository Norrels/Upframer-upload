export interface DLQMessage {
  videoName: string;
  VideoPath: string;
  jobId: string;
}

export interface DLQHeaders {
  "x-original-queue": string;
  "x-failure-reason": string;
  "x-retry-count": number;
}
