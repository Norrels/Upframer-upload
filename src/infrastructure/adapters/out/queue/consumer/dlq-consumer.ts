import { Channel, ConsumeMessage } from "amqplib";
import {
  DLQMessage,
  DLQHeaders,
} from "../../../../../domain/entities/dlq-message";
import { EmailNotificationPort } from "../../../../../domain/ports/out/notification/email-notification.port";
import { JobRepository } from "../../../../../domain/ports/out/persistence/job-repository";
import {
  JobStatus,
  JobStatusEnum,
} from "../../../../../domain/entities/job-status-enum";

const DLQ_QUEUE = "job-creation.dlq";
const DLQ_EXCHANGE = "job-creation.dlq.exchange";
const DLQ_ROUTING_KEY = "job-creation.dlq";

export async function processDLQMessages(
  channel: Channel,
  emailNotification: EmailNotificationPort,
  repository: JobRepository
): Promise<void> {
  try {
    await channel.assertExchange(DLQ_EXCHANGE, "direct", { durable: true });

    await channel.assertQueue(DLQ_QUEUE, { durable: true });

    await channel.bindQueue(DLQ_QUEUE, DLQ_EXCHANGE, DLQ_ROUTING_KEY);

    console.log(`[DLQ Consumer] Waiting for messages in ${DLQ_QUEUE}...`);

    await channel.consume(
      DLQ_QUEUE,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const content = msg.content.toString();
          const message: DLQMessage = JSON.parse(content);

          const headers = msg.properties.headers as DLQHeaders;
          const originalQueue = headers["x-original-queue"] || "unknown";
          const failureReason =
            headers["x-failure-reason"] || "No reason provided";
          const retryCount = headers["x-retry-count"] || 0;

          console.log("[DLQ Consumer] Failed message received:", {
            jobId: message.jobId,
            videoName: message.videoName,
            originalQueue,
            failureReason,
            retryCount,
          });

          await repository.updateJob(message.jobId, "failed");
          console.log(
            `[DLQ Consumer] Job status updated to FAILED: ${message.jobId}`
          );

          const userEmail = await repository.getUserEmailByJobId(message.jobId);

          if (!userEmail) {
            console.warn(
              `[DLQ Consumer] No user email found for job: ${message.jobId}`
            );
          } else {
            await sendUserNotification(
              emailNotification,
              userEmail,
              message,
              failureReason,
              retryCount
            );
            console.log(`[DLQ Consumer] Email sent to user: ${userEmail}`);
          }

          channel.ack(msg);
          console.log(
            `[DLQ Consumer] Message processed and acknowledged: ${message.jobId}`
          );
        } catch (error) {
          console.error("[DLQ Consumer] Error processing message:", error);
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("[DLQ Consumer] Error setting up DLQ consumer:", error);
    throw error;
  }
}

async function sendUserNotification(
  emailNotification: EmailNotificationPort,
  userEmail: string,
  message: DLQMessage,
  failureReason: string,
  retryCount: number
): Promise<void> {
  const subject = `Erro no processamento do seu vídeo - ${message.videoName}`;

  const htmlContent = `
    <h2>Falha no Processamento do Vídeo</h2>
    <p>Infelizmente, ocorreu um erro ao processar o seu vídeo.</p>

    <h3>Detalhes do Vídeo:</h3>
    <ul>
      <li><strong>Nome do vídeo:</strong> ${message.videoName}</li>
      <li><strong>ID do Job:</strong> ${message.jobId}</li>
    </ul>

    <h3>Informações do Erro:</h3>
    <ul>
      <li><strong>Motivo:</strong> ${failureReason}</li>
      <li><strong>Tentativas realizadas:</strong> ${retryCount}</li>
    </ul>

    <p>Por favor, tente enviar o vídeo novamente ou entre em contato com o suporte se o problema persistir.</p>

    <p><em>Este é um email automático do sistema de processamento de vídeos.</em></p>
  `;

  const textContent = `
Falha no Processamento do Vídeo

Infelizmente, ocorreu um erro ao processar o seu vídeo.

Detalhes do Vídeo:
- Nome do vídeo: ${message.videoName}
- ID do Job: ${message.jobId}

Informações do Erro:
- Motivo: ${failureReason}
- Tentativas realizadas: ${retryCount}

Por favor, tente enviar o vídeo novamente ou entre em contato com o suporte se o problema persistir.

Este é um email automático do sistema de processamento de vídeos.
  `;

  await emailNotification.sendEmail({
    to: userEmail,
    subject,
    htmlContent,
    textContent,
  });
}
