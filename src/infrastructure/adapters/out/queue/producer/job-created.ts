import { Channel } from "amqplib";
import { JobCreationgMessage } from "../../../../../domain/entities/job-creation-message";

export async function despatchCreatedJob(
  channel: Channel,
  queue: string,
  job: JobCreationgMessage
) {
  const maxRetries = 3;
  await channel.assertQueue(queue, { durable: true });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        channel.sendToQueue(
          queue,
          Buffer.from(JSON.stringify(job)),
          {},
          (err: any) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      console.log(`Message sent on attempt ${attempt}:`, job.jobId);
      return;
    } catch (err) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, err);

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to RabbitMQ after ${maxRetries} attempt: ${err}`
        );
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
