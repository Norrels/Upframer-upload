import { fastify } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { UploadVideoUseCase } from "./application/use-cases/upload-video.use-case.ts";
import { UploadVideoPort } from "./domain/ports/upload-video.port.ts";
import { LocalFileStorageAdapter } from "./infrastructure/adapters/out/local-file-storage.adapter.ts";
import { UploadControllerAdapter } from "./infrastructure/adapters/in/upload-controller.adapter.ts";

const app = fastify();

const fileStorage = new LocalFileStorageAdapter();
const uploadVideoUseCase: UploadVideoPort = new UploadVideoUseCase(fileStorage);
const uploadController = new UploadControllerAdapter(uploadVideoUseCase);

app.register(fastifyMultipart, {
  limits: {
    fileSize: 1_040_576 * 100, //100 mb
  },
});

app.post("/api/upload-video", async (request, reply) => {
  await uploadController.handle(request, reply);
});

app.listen({ port: 3000 }).then(() => {
  console.log("Server is running on http://localhost:3000");
});
