import { JobCreationgMessage } from "../../../entities/job-creation-message";

export interface QueueProcessorPort {
  processorUpdateStatusMessage();

  despatchCreatedMessage(queue: string, job: JobCreationgMessage);
}
