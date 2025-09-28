import { JobCreationgMessage } from "../../../entities/job-creation-message";

export interface QueueProcessorPort {
  processorUpdateStatusMessage(): void;

  despatchCreatedMessage(queue: string, job: JobCreationgMessage): void;
}
