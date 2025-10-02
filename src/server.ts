import { fastify } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { UploadVideoUseCase } from "./application/use-cases/upload-video.use-case";
import { UploadVideoPort } from "./domain/ports/upload-video.port";
import { UploadControllerAdapter } from "./infrastructure/adapters/in/upload-controller.adapter";
import { config } from "./env";
import { UpdateStatusUseCase } from "./application/use-cases/update-status.use-case";
import { RabbitMQAdapter } from "./infrastructure/adapters/out/queue/rabbitmq.adapter";
import {
  closeRabbit,
  connectRabbit,
} from "./infrastructure/adapters/out/queue/broker";
import { JobRepositoryDrizzle } from "./infrastructure/adapters/out/persistence/job-repository.adapter";
import { S3FileStorageAdapter } from "./infrastructure/adapters/out/storage/s3-file-storage.adapter";
import { authMiddleware } from "./infrastructure/middleware/auth.middleware";
import { GetUserUploadsUseCase } from "./application/use-cases/get-user-uploads.use-case";
import { GetJobStatusUseCase } from "./application/use-cases/get-job-status.use-case";
import { GetUserUploadsControllerAdapter } from "./infrastructure/adapters/in/get-user-uploads-controller.adapter";
import { GetJobStatusControllerAdapter } from "./infrastructure/adapters/in/get-job-status-controller.adapter";
import { EmailNotificationAdapter } from "./infrastructure/adapters/out/notification/email-notification.adapter";

const app = fastify();

const repository = new JobRepositoryDrizzle();
const fileStorage = new S3FileStorageAdapter();
const emailNotification = new EmailNotificationAdapter();
const messageQueue = new RabbitMQAdapter(repository, emailNotification);
const uploadVideoUseCase: UploadVideoPort = new UploadVideoUseCase(
  fileStorage,
  messageQueue,
  repository
);
const uploadController = new UploadControllerAdapter(uploadVideoUseCase);
const updateStatusUseCase = new UpdateStatusUseCase(messageQueue);

const getUserUploadsUseCase = new GetUserUploadsUseCase(repository);
const getJobStatusUseCase = new GetJobStatusUseCase(repository);
const getUserUploadsController = new GetUserUploadsControllerAdapter(
  getUserUploadsUseCase
);
const getJobStatusController = new GetJobStatusControllerAdapter(
  getJobStatusUseCase
);

app.register(fastifyMultipart, {
  limits: {
    fileSize: 1_040_576 * 100, //100 mb
  },
});

app.get("/health", () => {
  return "OK";
});

app.post(
  "/api/upload-video",
  {
    preHandler: authMiddleware,
  },
  async (request, reply) => {
    await uploadController.handle(request, reply);
  }
);

app.get(
  "/api/my-uploads",
  {
    preHandler: authMiddleware,
  },
  async (request, reply) => {
    await getUserUploadsController.handle(request, reply);
  }
);

app.get(
  "/api/job/:jobId/status",
  {
    preHandler: authMiddleware,
  },
  async (request, reply) => {
    await getJobStatusController.handle(request, reply);
  }
);

app.get(
  "/api/my-uploads",
  {
    preHandler: authMiddleware,
  },
  async (request, reply) => {
    await getUserUploadsController.handle(request, reply);
  }
);

app.get(
  "/api/job/:jobId/status",
  {
    preHandler: authMiddleware,
  },
  async (request, reply) => {
    await getJobStatusController.handle(request, reply);
  }
);

const start = async () => {
  try {
    await connectRabbit();
    await updateStatusUseCase.execute();
    await app.listen({ host: "0.0.0.0", port: config.PORT });
    console.log("Server running on http://localhost:" + config.PORT);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

async function gracefulShutdown() {
  await app.close();
  console.log("HTTP server closed");
  await closeRabbit();
  console.log("RAbbitMQ connection closed");

  process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

start();
