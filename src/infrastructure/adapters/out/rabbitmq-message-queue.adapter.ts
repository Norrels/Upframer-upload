import { MessageQueuePort } from "../../../domain/ports/message-queue.port";
import { sendToQueue } from "../../rabbit/producer";

export class RabbitMQAdapter implements MessageQueuePort {
  async sendMessage(queue: string, message: any) {
    await sendToQueue(queue, message);
  }
}
