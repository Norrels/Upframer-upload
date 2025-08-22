import amqp, { Channel, Connection } from "amqplib";
import { config } from "../../../env";

let channel: Channel | null = null;
let connection: Connection | null = null;

export async function connectRabbit(): Promise<void> {
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      connection = await amqp.connect(config.RABBITMQ_URL);
      channel = await connection.createConfirmChannel();
      console.log("RabbitMQ successfully connected");
      return;
    } catch (err) {
      console.error(
        `❌ Connection attempt: ${attempt}/${maxRetries} failed:`,
        err
      );

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to RabbitMQ after ${maxRetries} attempts`
        );
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function closeRabbit(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (err) {
    console.error("Error while closing RabbitMQ:", err);
  }
}

export function getChannel(): Channel {
  if (!channel) throw new Error("RabbitMQ is not connected");
  return channel;
}
