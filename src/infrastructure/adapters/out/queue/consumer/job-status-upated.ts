import { config } from "../../../../../../env";
import { UpdatedStatusMessageSchema } from "../../../../../domain/entities/update-status-message";
import { JobRepository } from "../../../../../domain/ports/out/persistence/jobRepository";
import { validateMessage } from "../../../../../utils/validate-message";
import { ConsumeMessage, Channel } from "amqplib";

export async function processJobMessage(
  message: any,
  jobRepository: JobRepository
): Promise<void> {
  const validatedMessage = UpdatedStatusMessageSchema.safeParse(message);

  if (!validatedMessage.success) {
    throw new Error(`Invalid message data: ${validatedMessage.error.message}`);
  }
  const validateMessage = validatedMessage.data;
  await jobRepository.updateJob(validateMessage.id, validateMessage.status);
}

export async function processeStatusUpdate(
  jobRepository: JobRepository,
  channel: Channel
) {
  channel.assertQueue(config.RABBITMQ_QUEUE_STATUS_CHANGE, { durable: true });

  return await channel.consume(
    config.RABBITMQ_QUEUE_STATUS_CHANGE,
    async (msg: ConsumeMessage | null) => {
      if (!msg) {
        console.error("Received null message");
        return;
      }

      try {
        const parsed = validateMessage(msg.content.toString());
        await processJobMessage(parsed, jobRepository);

        channel.ack(msg);
        console.info("Job processed and saved successfully");
      } catch (error) {
        console.error("Error processing job:", error);
        channel.nack(msg, false, false);
      }
    }
  );
}
