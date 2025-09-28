import amqplib, { Channel } from "amqplib";
import { config } from "../../../../env";

class RabbitMQBroker {
  private connection: any;
  private maxRetries = 5;

  async connect() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.connection = await amqplib.connect(config.RABBITMQ_URL);
      } catch (err) {
        console.log(
          `Connection attempt: ${attempt}/${this.maxRetries} failed:`,
          err
        );

        if (attempt === this.maxRetries) {
          throw new Error(
            `Failed to connect to RabbitMQ after ${this.maxRetries} attempts`
          );
        }

        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async close(): Promise<void> {
    try {
      if (this.connection) await this.connection.close();
      this.connection = null;
    } catch (err) {
      console.error(`Error closing RabbitMQ connection: ${err}`);
      throw err;
    }
  }

  async createChannel(): Promise<Channel> {
    if (!this.connection) {
      await this.connect();
    }

    if (!this.connection) {
      throw new Error("Failed to establish RabbitMQ connection");
    }

    const channel = await this.connection.createChannel();

    return channel;
  }
}

const rabbitMQ = new RabbitMQBroker();

export async function connectRabbit(): Promise<void> {
  await rabbitMQ.connect();
}

export async function closeRabbit(): Promise<void> {
  await rabbitMQ.close();
}

export async function createChannel(): Promise<Channel> {
  return await rabbitMQ.createChannel();
}

// TO:DO DLQ
