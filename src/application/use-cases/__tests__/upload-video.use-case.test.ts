import { describe, it, expect, beforeEach, vi } from "vitest";
import { UploadVideoUseCase } from "../upload-video.use-case";
import { FileStoragePort } from "../../../domain/ports/out/storage/file-storage.port";
import { QueueProcessorPort } from "../../../domain/ports/out/queue/queue-processor.port";
import { JobRepository } from "../../../domain/ports/out/persistence/job-repository";
import { UploadVideoRequest } from "../../../domain/ports/upload-video.port";
import { Readable } from "stream";

vi.mock("../../../../env.ts", () => ({
  config: {
    RABBITMQ_QUEUE_CREATED: "test-queue",
  },
}));

describe("UploadVideoUseCase", () => {
  let uploadVideoUseCase: UploadVideoUseCase;
  let mockFileStorage: FileStoragePort;
  let mockMessageQueue: QueueProcessorPort;
  let mockRepository: JobRepository;

  const createMockReadableStream = (data: string): NodeJS.ReadableStream => {
    const readable = new Readable();
    readable.push(data);
    readable.push(null);
    return readable;
  };

  beforeEach(() => {
    mockFileStorage = {
      saveFile: vi.fn(),
    };

    mockMessageQueue = {
      despatchCreatedMessage: vi.fn(),
      processorUpdateStatusMessage: vi.fn(),
    };

    mockRepository = {
      saveJob: vi.fn(),
      updateJob: vi.fn(),
      findJobsByUserId: vi.fn(),
      findJobById: vi.fn(),
    };

    uploadVideoUseCase = new UploadVideoUseCase(
      mockFileStorage,
      mockMessageQueue,
      mockRepository
    );
  });

  describe("successful upload", () => {
    it("should successfully upload a video and return success response", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "test-video.mp4",
        file: createMockReadableStream("fake video content"),
      };

      const mockFilePath = "/uploads/test-video-123.mp4";
      mockFileStorage.saveFile = vi.fn().mockResolvedValue(mockFilePath);
      mockRepository.saveJob = vi.fn().mockResolvedValue(undefined);
      mockMessageQueue.despatchCreatedMessage = vi
        .fn()
        .mockResolvedValue(undefined);

      const result = await uploadVideoUseCase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.videoId).toBeDefined();
      expect(result.filename).toContain("test-video.mp4");
      expect(result.error).toBeUndefined();
    });

    it("should call file storage with correct parameters", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "my-video.mp4",
        file: createMockReadableStream("video data"),
      };

      mockFileStorage.saveFile = vi.fn().mockResolvedValue("/path/to/file");
      mockRepository.saveJob = vi.fn().mockResolvedValue(undefined);
      mockMessageQueue.despatchCreatedMessage = vi
        .fn()
        .mockResolvedValue(undefined);

      await uploadVideoUseCase.execute(mockRequest);

      expect(mockFileStorage.saveFile).toHaveBeenCalledWith(
        {
          filename: "my-video.mp4",
          file: expect.any(Object),
        },
        expect.stringContaining("my-video.mp4") 
      );
    });

    it("should save job to repository with correct data", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "test.mp4",
        file: createMockReadableStream("data"),
      };

      mockFileStorage.saveFile = vi.fn().mockResolvedValue("/uploads/test.mp4");
      mockRepository.saveJob = vi.fn().mockResolvedValue(undefined);
      mockMessageQueue.despatchCreatedMessage = vi
        .fn()
        .mockResolvedValue(undefined);

      await uploadVideoUseCase.execute(mockRequest);

      expect(mockRepository.saveJob).toHaveBeenCalledWith({
        userId: 1,
        userEmail: "matheus@gmail.com",
        jobId: expect.any(String),
        videoName: expect.stringContaining("test.mp4"),
        videoPath: "/uploads/test.mp4",
      });
    });

    it("should send message to queue with correct job data", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "queue-test.mp4",
        file: createMockReadableStream("data"),
      };

      mockFileStorage.saveFile = vi
        .fn()
        .mockResolvedValue("/uploads/queue-test.mp4");
      mockRepository.saveJob = vi.fn().mockResolvedValue(undefined);
      mockMessageQueue.despatchCreatedMessage = vi
        .fn()
        .mockResolvedValue(undefined);

      await uploadVideoUseCase.execute(mockRequest);

      expect(mockMessageQueue.despatchCreatedMessage).toHaveBeenCalledWith(
        "test-queue",
        expect.objectContaining({
          jobId: expect.any(String),
          videoName: expect.stringContaining("queue-test.mp4"),
          videoPath: "/uploads/queue-test.mp4",
        })
      );
    });
  });

  describe("error handling", () => {
    it("should return error response when file storage fails", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "test.mp4",
        file: createMockReadableStream("data"),
      };

      const storageError = new Error("Storage service unavailable");
      mockFileStorage.saveFile = vi.fn().mockRejectedValue(storageError);

      const result = await uploadVideoUseCase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Storage service unavailable");
      expect(result.videoId).toBeUndefined();
      expect(result.filename).toBeUndefined();
    });

    it("should return error response when repository save fails", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "test.mp4",
        file: createMockReadableStream("data"),
      };

      mockFileStorage.saveFile = vi.fn().mockResolvedValue("/path/to/file");
      const repositoryError = new Error("Database connection failed");
      mockRepository.saveJob = vi.fn().mockRejectedValue(repositoryError);

      const result = await uploadVideoUseCase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
    });

    it("should return error response when queue dispatch fails", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "test.mp4",
        file: createMockReadableStream("data"),
      };

      mockFileStorage.saveFile = vi.fn().mockResolvedValue("/path/to/file");
      mockRepository.saveJob = vi.fn().mockResolvedValue(undefined);
      const queueError = new Error("Queue service down");
      mockMessageQueue.despatchCreatedMessage = vi
        .fn()
        .mockRejectedValue(queueError);

      const result = await uploadVideoUseCase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Queue service down");
    });

    it("should return generic error message for unknown errors", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "test.mp4",
        file: createMockReadableStream("data"),
      };

      mockFileStorage.saveFile = vi.fn().mockRejectedValue("String error");

      const result = await uploadVideoUseCase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Upload failed");
    });

    it("should handle invalid filename in VideoName creation", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "invalid-file.txt",
        file: createMockReadableStream("data"),
      };

      const result = await uploadVideoUseCase.execute(mockRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid file type");
    });
  });

  describe("integration flow", () => {
    it("should execute complete flow in correct order", async () => {
      const mockRequest: UploadVideoRequest = {
        filename: "flow-test.mp4",
        file: createMockReadableStream("data"),
      };

      const callOrder: string[] = [];

      mockFileStorage.saveFile = vi.fn().mockImplementation(async () => {
        callOrder.push("fileStorage");
        return "/uploads/flow-test.mp4";
      });

      mockRepository.saveJob = vi.fn().mockImplementation(async () => {
        callOrder.push("repository");
      });

      mockMessageQueue.despatchCreatedMessage = vi
        .fn()
        .mockImplementation(async () => {
          callOrder.push("queue");
        });

      const result = await uploadVideoUseCase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(callOrder).toEqual(["fileStorage", "repository", "queue"]);
    });
  });
});
