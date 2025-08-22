export interface MessageQueuePort {
    sendMessage(queue: string, message: any): Promise<void>;
  }