import { config } from "../../../../../env";
import { UpdatedStatusMessageSchema } from "../../../../../domain/entities/update-status-message";
import { JobRepository } from "../../../../../domain/ports/out/persistence/job-repository";
import { EmailNotificationPort } from "../../../../../domain/ports/out/notification/email-notification.port";
import { validateMessage } from "../../../../../utils/validate-message";
import { ConsumeMessage, Channel } from "amqplib";

export async function processJobMessage(
  message: any,
  jobRepository: JobRepository,
  emailNotification?: EmailNotificationPort
): Promise<void> {
  const validatedMessage = UpdatedStatusMessageSchema.safeParse(message);

  if (!validatedMessage.success) {
    throw new Error(`Invalid message data: ${validatedMessage.error.message}`);
  }

  const messageData = validatedMessage.data;

  await jobRepository.updateJob(
    messageData.jobId,
    messageData.status,
    messageData.outputPath
  );

  if (messageData.status === "failed" && emailNotification) {
    try {
      const job = await jobRepository.findJobById(messageData.jobId);

      if (job) {
        const userEmail = await getUserEmailByJobId(
          messageData.jobId,
          jobRepository
        );

        if (userEmail) {
          await emailNotification.sendEmail({
            to: userEmail,
            subject: "Processamento de Vídeo Falhou",
            htmlContent: generateFailureEmailHtml(
              messageData.jobId,
              job.videoUrl
            ),
            textContent: `Olá,\n\nInfelizmente, o processamento do seu vídeo (Job ID: ${messageData.jobId}) falhou.\n\nVocê pode tentar fazer o upload novamente ou entrar em contato com nosso suporte.\n\nAtenciosamente,\nEquipe Upframer`,
          });

          console.log(
            `Email de falha enviado para: ${userEmail}, Job ID: ${messageData.jobId}`
          );
        }
      }
    } catch (emailError) {
      console.error(
        `Erro ao enviar email de notificação para job ${messageData.jobId}:`,
        emailError
      );
    }
  }
}

async function getUserEmailByJobId(
  jobId: string,
  jobRepository: JobRepository
): Promise<string | null> {
  try {
    return await jobRepository.getUserEmailByJobId(jobId);
  } catch (error) {
    console.error("Erro ao buscar email do usuário:", error);
    return null;
  }
}

function generateFailureEmailHtml(jobId: string, videoName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Processamento Falhou</h1>
        </div>
        <div class="content">
          <p>Olá,</p>
          <p>Infelizmente, o processamento do seu vídeo falhou.</p>
          <p><strong>Detalhes:</strong></p>
          <ul>
            <li><strong>Job ID:</strong> ${jobId}</li>
            <li><strong>Arquivo:</strong> ${videoName}</li>
            <li><strong>Status:</strong> Falhou</li>
          </ul>
          <p>Você pode tentar fazer o upload novamente ou entrar em contato com nosso suporte se o problema persistir.</p>
          <p>Atenciosamente,<br>Equipe Upframer</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function processeStatusUpdate(
  jobRepository: JobRepository,
  channel: Channel,
  emailNotification?: EmailNotificationPort
) {
  await channel.assertQueue(config.RABBITMQ_QUEUE_STATUS_CHANGE, {
    durable: true,
  });

  return await channel.consume(
    config.RABBITMQ_QUEUE_STATUS_CHANGE,
    async (msg: ConsumeMessage | null) => {
      if (!msg) {
        console.error("Received null message");
        return;
      }

      try {
        const parsed = validateMessage(msg.content.toString());
        await processJobMessage(parsed, jobRepository, emailNotification);

        channel.ack(msg);
        console.info("Job processed and saved successfully");
      } catch (error) {
        console.error("Error processing job:", error);
        channel.nack(msg, false, false);
      }
    }
  );
}
