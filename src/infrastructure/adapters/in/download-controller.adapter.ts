import { FastifyRequest, FastifyReply } from "fastify";
import { DownloadFilePort } from "../../../application/use-cases/download-file.use-case";

export class DownloadControllerAdapter {
  constructor(private readonly downloadFileUseCase: DownloadFilePort) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { jobId } = request.params as { jobId: string };

    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    console.log("Authenticated user:", request.user);

    const result = await this.downloadFileUseCase.execute({
      jobId,
      userId: request.user.userId,
    });

    if (!result.success) {
      const statusCode =
        result.error === "Unauthorized"
          ? 403
          : result.error === "Job not found"
          ? 404
          : 400;
      return reply.status(statusCode).send({ error: result.error });
    }

    return reply.status(200).send({
      success: true,
      downloadUrl: result.downloadUrl,
    });
  }
}
