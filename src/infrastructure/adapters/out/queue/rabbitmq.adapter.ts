import { JobCreationgMessage } from "../../../../domain/entities/job-creation-message";
import { JobRepository } from "../../../../domain/ports/out/persistence/jobRepository";
import { QueueProcessorPort } from "../../../../domain/ports/out/queue/queue-processor.port";
import { createChannel } from "./broker";
import { processeStatusUpdate } from "./consumer/job-status-upated";
import { despatchCreatedJob } from "./producer/job-created";

export class RabbitMQAdapter implements QueueProcessorPort {
  constructor(private repository: JobRepository) {}
  channel = createChannel();

  async despatchCreatedMessage(queue: string, job: JobCreationgMessage) {
    await despatchCreatedJob(this.channel, queue, job);
  }

  async processorUpdateStatusMessage() {
    await processeStatusUpdate(this.repository, this.channel);
  }
}
