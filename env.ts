import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  RABBITMQ_URL: z.url("Invalid RabbitMQ URL"),
  RABBITMQ_QUEUE_STATUS_CHANGE: z.string().default("video-processing-result"),
  RABBITMQ_QUEUE_CREATED: z.string().default("job-creation"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  AWS_SESSION_TOKEN: z.string().optional(), // OBSERVAÇÃO: Pode ser necessário para credenciais temporárias
  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  AWS_S3_BUCKET_NAME: z.string().min(1, "AWS_S3_BUCKET_NAME is required"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("Invalid environment variables:", env.error.format());
  process.exit(1);
}

export const config = env.data;
