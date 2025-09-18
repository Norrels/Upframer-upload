import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  RABBITMQ_URL: z.url("Invalid RabbitMQ URL"),
  RABBITMQ_QUEUE_STATUS_CHANGE: z.string().default("video-processing-result"),
  RABBITMQ_QUEUE_CREATED: z.string().default("job-creation"),
  DATABASE_URL: z.url("Invalid Database URL"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("Invalid environment variables:", env.error.format());
  process.exit(1);
}

export const config = env.data;
