import { FastifyRequest, FastifyReply } from "fastify";
import { UploadVideoPort } from "../../../domain/ports/upload-video.port";

export class UploadControllerAdapter {
  constructor(private readonly uploadVideoUseCase: UploadVideoPort) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();

    if (!data) {
      reply.status(400).send({ error: "No file uploaded" });
      return;
    }

    if (!request.user) {
      reply.status(401).send({ error: "User not authenticated" });
      return;
    }

    const result = await this.uploadVideoUseCase.execute({
      filename: data.filename,
      file: data.file,
      userId: request.user.userId,
      userEmail: request.user.email,
    });

    if (!result.success) {
      reply.status(400).send({ error: result.error });
      return;
    }

    reply.status(200).send({
      message: "Video uploaded successfully",
      videoId: result.videoId,
      filename: result.filename,
      status: "pending",
    });
  }
}
