import { JobCreationgMessage } from "../../../../domain/entities/job-creation-message";
import { JobRepository } from "../../../../domain/ports/out/persistence/job-repository";
import { QueueProcessorPort } from "../../../../domain/ports/out/queue/queue-processor.port";
import { EmailNotificationPort } from "../../../../domain/ports/out/notification/email-notification.port";
import { createChannel } from "./broker";
import { processeStatusUpdate } from "./consumer/job-status-upated";
import { despatchCreatedJob } from "./producer/job-created";

export class RabbitMQAdapter implements QueueProcessorPort {
  private channel: any;

  constructor(
    private repository: JobRepository,
    private emailNotification?: EmailNotificationPort
  ) {}

  private async getChannel() {
    if (!this.channel) {
      this.channel = await createChannel();
    }
    return this.channel;
  }

  async despatchCreatedMessage(queue: string, job: JobCreationgMessage) {
    const channel = await this.getChannel();
    await despatchCreatedJob(channel, queue, job);
  }

  async processorUpdateStatusMessage() {
    const channel = await this.getChannel();
    await processeStatusUpdate(this.repository, channel, this.emailNotification);
  }
}
