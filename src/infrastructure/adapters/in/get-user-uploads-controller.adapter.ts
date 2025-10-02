import { FastifyRequest, FastifyReply } from "fastify";
import { GetUserUploadsPort } from "../../../application/use-cases/get-user-uploads.use-case";

export class GetUserUploadsControllerAdapter {
  constructor(private readonly getUserUploadsUseCase: GetUserUploadsPort) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ error: "User not authenticated" });
    }

    const result = await this.getUserUploadsUseCase.execute({
      userId: request.user.userId,
    });

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.status(200).send({
      success: true,
      uploads: result.uploads
    });
  }
}