import { Channel } from "amqplib";
import { JobCreationgMessage } from "../../../../../domain/entities/job-creation-message";

export async function despatchCreatedJob(
  channel: Channel,
  queue: string,
  job: JobCreationgMessage
) {
  const maxRetries = 3;
  await channel.assertQueue(queue, { durable: true });
  console.log("Chegou aqui createdJOb");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(job)),
        { persistent: true }
      );

      if (!success) {
        throw new Error("Failed to send message to queue");
      }

      console.log(`Message sent on attempt ${attempt}:`, job.jobId);
      return;
    } catch (err) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, err);

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to send message to RabbitMQ after ${maxRetries} attempts: ${err}`
        );
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
