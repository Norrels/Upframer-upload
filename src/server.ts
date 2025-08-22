import { fastify } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { UploadVideoUseCase } from "./application/use-cases/upload-video.use-case.ts";
import { UploadVideoPort } from "./domain/ports/upload-video.port.ts";
import { LocalFileStorageAdapter } from "./infrastructure/adapters/out/local-file-storage.adapter.ts";
import { RabbitMQAdapter } from "./infrastructure/adapters/out/rabbitmq-message-queue.adapter.ts";
import { UploadControllerAdapter } from "./infrastructure/adapters/in/upload-controller.adapter.ts";
import { closeRabbit, connectRabbit } from "./infrastructure/rabbit/rabbit.ts";
import { config } from "../env.ts";

const app = fastify();

const fileStorage = new LocalFileStorageAdapter();
const messageQueue = new RabbitMQAdapter();
const uploadVideoUseCase: UploadVideoPort = new UploadVideoUseCase(
  fileStorage,
  messageQueue
);
const uploadController = new UploadControllerAdapter(uploadVideoUseCase);

app.register(fastifyMultipart, {
  limits: {
    fileSize: 1_040_576 * 100, //100 mb
  },
});

app.post("/api/upload-video", async (request, reply) => {
  await uploadController.handle(request, reply);
});

const start = async () => {
  try {
    await connectRabbit();
    await app.listen({ port: config.PORT });
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
