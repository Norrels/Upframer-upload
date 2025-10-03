import { fastify } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
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
import { DownloadFileUseCase } from "./application/use-cases/download-file.use-case";
import { DownloadControllerAdapter } from "./infrastructure/adapters/in/download-controller.adapter";

async function setupApp() {
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
  const downloadFileUseCase = new DownloadFileUseCase(repository, fileStorage);
  const getUserUploadsController = new GetUserUploadsControllerAdapter(
    getUserUploadsUseCase
  );
  const getJobStatusController = new GetJobStatusControllerAdapter(
    getJobStatusUseCase
  );
  const downloadController = new DownloadControllerAdapter(downloadFileUseCase);

  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_040_576 * 100, //100 mb
    },
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Upframer Upload API",
        description: "API para upload e processamento de vídeos",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: ({ schema, url }) => {
      if (url === "/api/upload-video") {
        return {
          schema: {
            ...schema,
            body: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          url,
        };
      }
      return { schema, url };
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Verifica o status da API",
        response: {
          200: {
            type: "string",
            example: "OK",
          },
        },
      },
    },
    () => {
      return "OK";
    }
  );

  app.post(
    "/api/upload-video",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["Upload"],
        summary: "Faz upload de um vídeo para processamento",
        description:
          "Envia um arquivo de vídeo MP4 para processamento. Use multipart/form-data com o campo 'file'.",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "Video uploaded successfully",
              },
              videoId: { type: "string", example: "clxyz123abc" },
              filename: { type: "string", example: "video.mp4" },
              status: { type: "string", example: "pending" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            type: "object",
            properties: {
              error: { type: "string", example: "Unauthorized" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      await uploadController.handle(request, reply);
    }
  );

  app.get(
    "/api/my-uploads",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["Uploads"],
        summary: "Lista todos os uploads do usuário autenticado",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              uploads: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    jobId: { type: "string", example: "user123" },
                    status: {
                      type: "string",
                      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
                    },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          401: {
            type: "object",
            properties: {
              error: { type: "string", example: "Unauthorized" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      await getUserUploadsController.handle(request, reply);
    }
  );

  app.get(
    "/api/job/:jobId/status",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["Jobs"],
        summary: "Consulta o status de um job específico",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            jobId: {
              type: "string",
              description: "ID do job",
              minLength: 1,
            },
          },
          required: ["jobId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              job: {
                type: "object",
                properties: {
                  id: { type: "string", example: "clxyz123abc" },
                  videoUrl: {
                    type: "string",
                    example: "https://bucket.s3.amazonaws.com/video.mp4",
                  },
                  outputPath: {
                    type: "string",
                    nullable: true,
                  },
                  status: {
                    type: "string",
                    enum: ["processing", "completed", "failed"],
                  },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          401: {
            type: "object",
            properties: {
              error: { type: "string", example: "Unauthorized" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string", example: "Job not found" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      await getJobStatusController.handle(request, reply);
    }
  );

  app.get(
    "/api/job/:jobId/download",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["Jobs"],
        summary: "Faz download do arquivo ZIP processado",
        description: "Retorna o arquivo ZIP com os frames extraídos do vídeo",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            jobId: {
              type: "string",
              description: "ID do job",
              minLength: 1,
            },
          },
          required: ["jobId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              downloadUrl: {
                type: "string",
                example: "https://bucket.s3.amazonaws.com/output.zip",
              },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            type: "object",
            properties: {
              error: { type: "string", example: "Unauthorized" },
            },
          },
          403: {
            type: "object",
            properties: {
              error: { type: "string", example: "Unauthorized" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string", example: "Job not found" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      await downloadController.handle(request, reply);
    }
  );

  return { app, updateStatusUseCase, messageQueue };
}

const start = async () => {
  try {
    const { app, updateStatusUseCase, messageQueue } = await setupApp();

    await connectRabbit();
    await updateStatusUseCase.execute();
    await messageQueue.processDLQMessages();
    await app.listen({ host: "0.0.0.0", port: config.PORT });
    console.log("Server running on http://localhost:" + config.PORT);
    console.log(
      "Swagger docs available at http://localhost:" + config.PORT + "/docs"
    );

    async function gracefulShutdown() {
      await app.close();
      console.log("HTTP server closed");
      await closeRabbit();
      console.log("RAbbitMQ connection closed");
      process.exit(0);
    }

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
