import { FastifyRequest, FastifyReply } from "fastify";
import { GetJobStatusPort } from "../../../application/use-cases/get-job-status.use-case";

interface GetJobStatusParams {
  jobId: string;
}

export class GetJobStatusControllerAdapter {
  constructor(private readonly getJobStatusUseCase: GetJobStatusPort) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      reply.status(401).send({ error: "User not authenticated" });
      return;
    }

    const { jobId } = request.params as GetJobStatusParams;

    if (!jobId) {
      reply.status(400).send({ error: "Job ID is required" });
      return;
    }

    const result = await this.getJobStatusUseCase.execute({
      jobId,
      userId: request.user.userId,
    });

    if (!result.success) {
      reply.status(404).send({ error: result.error });
      return;
    }

    reply.status(200).send({
      success: true,
      job: result.job
    });
  }
}