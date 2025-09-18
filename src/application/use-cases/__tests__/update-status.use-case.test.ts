import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateStatusUseCase } from '../update-status.use-case';
import { QueueProcessorPort } from '../../../domain/ports/out/queue/queue-processor.port';

describe('UpdateStatusUseCase', () => {
  let updateStatusUseCase: UpdateStatusUseCase;
  let mockQueueProcessor: QueueProcessorPort;

  beforeEach(() => {
    mockQueueProcessor = {
      despatchCreatedMessage: vi.fn(),
      processorUpdateStatusMessage: vi.fn()
    };

    updateStatusUseCase = new UpdateStatusUseCase(mockQueueProcessor);
  });

  describe('execute', () => {
    it('should call queue processor to process update status messages', async () => {
      mockQueueProcessor.processorUpdateStatusMessage = vi.fn().mockResolvedValue(undefined);
      await updateStatusUseCase.execute();

      expect(mockQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledOnce();
    });

    it('should call queue processor without any parameters', async () => {
      mockQueueProcessor.processorUpdateStatusMessage = vi.fn().mockResolvedValue(undefined);
      await updateStatusUseCase.execute();

      expect(mockQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledWith();
    });

    it('should propagate errors from queue processor', async () => {
      const queueError = new Error('Queue processing failed');
      mockQueueProcessor.processorUpdateStatusMessage = vi.fn().mockRejectedValue(queueError);

      await expect(updateStatusUseCase.execute()).rejects.toThrow('Queue processing failed');
    });

    it('should handle queue processor returning a promise', async () => {
      let resolvePromise: () => void;
      const processingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      mockQueueProcessor.processorUpdateStatusMessage = vi.fn().mockReturnValue(processingPromise);
      const executePromise = updateStatusUseCase.execute();

      expect(mockQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledOnce();

      resolvePromise!();

      await executePromise;

      expect(mockQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledOnce();
    });

    it('should handle multiple consecutive calls', async () => {
      mockQueueProcessor.processorUpdateStatusMessage = vi.fn().mockResolvedValue(undefined);

      await updateStatusUseCase.execute();
      await updateStatusUseCase.execute();
      await updateStatusUseCase.execute();

      expect(mockQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledTimes(3);
    });

    it('should work with different queue processor implementations', async () => {
      const alternativeQueueProcessor: QueueProcessorPort = {
        despatchCreatedMessage: vi.fn(),
        processorUpdateStatusMessage: vi.fn().mockResolvedValue(undefined)
      };

      const alternativeUseCase = new UpdateStatusUseCase(alternativeQueueProcessor);

      await alternativeUseCase.execute();

      expect(alternativeQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledOnce();
    });
  });

  describe('constructor', () => {
    it('should store queue processor dependency', () => {
      const useCase = new UpdateStatusUseCase(mockQueueProcessor);

      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it('should accept any implementation of QueueProcessorPort', () => {
      const customQueueProcessor: QueueProcessorPort = {
        despatchCreatedMessage: async () => {},
        processorUpdateStatusMessage: async () => {}
      };

      expect(() => new UpdateStatusUseCase(customQueueProcessor)).not.toThrow();
    });
  });

  describe('integration behavior', () => {
    it('should maintain consistent behavior across multiple executions', async () => {
      let callCount = 0;
      mockQueueProcessor.processorUpdateStatusMessage = vi.fn().mockImplementation(async () => {
        callCount++;
        return Promise.resolve();
      });

      await updateStatusUseCase.execute();
      await updateStatusUseCase.execute();

      expect(callCount).toBe(2);
      expect(mockQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle async queue processor correctly', async () => {
      mockQueueProcessor.processorUpdateStatusMessage = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return undefined;
      });

      const startTime = Date.now();
      await updateStatusUseCase.execute();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(10);
      expect(mockQueueProcessor.processorUpdateStatusMessage).toHaveBeenCalledOnce();
    });
  });
});