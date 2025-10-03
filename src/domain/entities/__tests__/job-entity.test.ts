import { describe, it, expect } from "vitest";
import { JobEntitySchema, JobEntity } from "../job-entity";

describe("JobEntity", () => {
  describe("JobEntitySchema validation", () => {
    const validJobData = {
      userId: "1",
      userEmail: "test@example.com",
      videoPath: "https://example.com/videos/test.mp4",
      videoName: "test-video.mp4",
      jobId: "uuid-12345",
    };

    it("should validate correct job entity data", () => {
      const result = JobEntitySchema.safeParse(validJobData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validJobData);
      }
    });

    it("should parse and return typed job entity", () => {
      const jobEntity: JobEntity = JobEntitySchema.parse(validJobData);

      expect(jobEntity.userId).toBe("1");
      expect(jobEntity.userEmail).toBe("test@example.com");
      expect(jobEntity.videoPath).toBe("https://example.com/videos/test.mp4");
      expect(jobEntity.videoName).toBe("test-video.mp4");
      expect(jobEntity.jobId).toBe("uuid-12345");
    });

    describe("userId validation", () => {
      it("should accept valid string userId", () => {
        const validData = { ...validJobData, userId: "123" };
        const result = JobEntitySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should reject empty userId", () => {
        const invalidData = { ...validJobData, userId: "" };
        const result = JobEntitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject number userId", () => {
        const invalidData = { ...validJobData, userId: 123 };
        const result = JobEntitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("userEmail validation", () => {
      it("should reject invalid email format", () => {
        const invalidData = { ...validJobData, userEmail: "invalid-email" };
        const result = JobEntitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject empty email", () => {
        const invalidData = { ...validJobData, userEmail: "" };
        const result = JobEntitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should accept valid email formats", () => {
        const validEmails = [
          "user@domain.com",
          "user.name@domain.co.uk",
          "user+tag@domain.org",
          "user123@domain123.com",
        ];

        validEmails.forEach((email) => {
          const testData = { ...validJobData, userEmail: email };
          const result = JobEntitySchema.safeParse(testData);
          expect(result.success).toBe(true);
        });
      });
    });

    describe("videoPath validation", () => {
      it("should reject invalid URL format", () => {
        const invalidData = { ...validJobData, videoPath: "not-a-url" };
        const result = JobEntitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should accept valid URL formats", () => {
        const validUrls = [
          "https://example.com/video.mp4",
          "http://localhost:3000/uploads/video.mp4",
          "file:///path/to/video.mp4",
          "ftp://server.com/videos/video.mp4",
        ];

        validUrls.forEach((url) => {
          const testData = { ...validJobData, videoPath: url };
          const result = JobEntitySchema.safeParse(testData);
          expect(result.success).toBe(true);
        });
      });
    });

    describe("videoName validation", () => {
      it("should accept empty video name (Zod string allows empty by default)", () => {
        const dataWithEmptyName = { ...validJobData, videoName: "" };

        const result = JobEntitySchema.safeParse(dataWithEmptyName);
        expect(result.success).toBe(true);
      });

      it("should accept any non-empty string as video name", () => {
        const validNames = [
          "video.mp4",
          "My Video File.mp4",
          "video-with-special-chars!@#.mp4",
          "视频文件.mp4",
          "123456.mp4",
        ];

        validNames.forEach((name) => {
          const testData = { ...validJobData, videoName: name };
          const result = JobEntitySchema.safeParse(testData);
          expect(result.success).toBe(true);
        });
      });
    });

    describe("jobId validation", () => {
      it("should accept empty job ID", () => {
        const dataWithEmptyId = { ...validJobData, jobId: "" };
        const result = JobEntitySchema.safeParse(dataWithEmptyId);
        expect(result.success).toBe(true);
      });

      it("should accept any non-empty string as job ID", () => {
        const validIds = [
          "uuid-12345",
          "550e8400-e29b-41d4-a716-446655440000",
          "job_123456",
          "JOB-2024-001",
        ];

        validIds.forEach((id) => {
          const testData = { ...validJobData, jobId: id };
          const result = JobEntitySchema.safeParse(testData);
          expect(result.success).toBe(true);
        });
      });
    });

    describe("missing fields validation", () => {
      it("should reject when missing required fields", () => {
        const requiredFields = [
          "userId",
          "userEmail",
          "videoPath",
          "videoName",
          "jobId",
        ];

        requiredFields.forEach((field) => {
          const invalidData = { ...validJobData };
          delete invalidData[field as keyof typeof validJobData];

          const result = JobEntitySchema.safeParse(invalidData);
          expect(result.success).toBe(false);
        });
      });

      it("should reject completely empty object", () => {
        const result = JobEntitySchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });
});
