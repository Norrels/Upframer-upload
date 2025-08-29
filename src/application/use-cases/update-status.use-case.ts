import { QueueProcessorPort } from "../../domain/ports/out/queue/queue-processor.port";

export class UpdateStatusUseCase {
  constructor(private queueProcessor: QueueProcessorPort) {}

  async execute() {
    await this.queueProcessor.processorUpdateStatusMessage();
  }
}
