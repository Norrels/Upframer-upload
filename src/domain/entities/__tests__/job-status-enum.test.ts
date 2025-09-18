import { describe, it, expect } from 'vitest';
import { JobStatusEnum, JobStatus } from '../job-status-enum';

describe('JobStatusEnum', () => {
  describe('valid status values', () => {
    it('should accept "processing" status', () => {
      const result = JobStatusEnum.safeParse('processing');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('processing');
      }
    });

    it('should accept "completed" status', () => {
      const result = JobStatusEnum.safeParse('completed');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('completed');
      }
    });

    it('should accept "failed" status', () => {
      const result = JobStatusEnum.safeParse('failed');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('failed');
      }
    });

    it('should parse to correct TypeScript type', () => {
      const processingStatus: JobStatus = JobStatusEnum.parse('processing');
      const completedStatus: JobStatus = JobStatusEnum.parse('completed');
      const failedStatus: JobStatus = JobStatusEnum.parse('failed');

      expect(processingStatus).toBe('processing');
      expect(completedStatus).toBe('completed');
      expect(failedStatus).toBe('failed');
    });
  });

  describe('invalid status values', () => {
    it('should reject invalid string status', () => {
      const invalidStatuses = [
        'pending',
        'running',
        'error',
        'cancelled',
        'unknown',
        'PROCESSING', 
        'COMPLETED',
        'FAILED'
      ];

      invalidStatuses.forEach(status => {
        const result = JobStatusEnum.safeParse(status);
        expect(result.success).toBe(false);
      });
    });

    it('should reject non-string values', () => {
      const nonStringValues = [
        123,
        true,
        false,
        null,
        undefined,
        {},
        [],
        0,
        1
      ];

      nonStringValues.forEach(value => {
        const result = JobStatusEnum.safeParse(value);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty string', () => {
      const result = JobStatusEnum.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only string', () => {
      const result = JobStatusEnum.safeParse('   ');
      expect(result.success).toBe(false);
    });
  });

  describe('enum options', () => {
    it('should have exactly 3 valid options', () => {
      const validOptions = ['processing', 'completed', 'failed'];
      const validationResults = validOptions.map(option =>
        JobStatusEnum.safeParse(option).success
      );
      expect(validationResults).toEqual([true, true, true]);
      expect(validOptions).toHaveLength(3);
    });

    it('should maintain consistency in valid options', () => {
      const option1 = JobStatusEnum.parse('processing');
      const option2 = JobStatusEnum.parse('completed');
      const option3 = JobStatusEnum.parse('failed');

      expect([option1, option2, option3]).toEqual(['processing', 'completed', 'failed']);
    });
  });

  describe('type safety', () => {
    it('should ensure type safety at compile time', () => {
      const processJobStatus = (status: JobStatus): string => {
        return `Job is ${status}`;
      };

      const processingResult = processJobStatus(JobStatusEnum.parse('processing'));
      const completedResult = processJobStatus(JobStatusEnum.parse('completed'));
      const failedResult = processJobStatus(JobStatusEnum.parse('failed'));

      expect(processingResult).toBe('Job is processing');
      expect(completedResult).toBe('Job is completed');
      expect(failedResult).toBe('Job is failed');
    });
  });

  describe('error handling', () => {
    it('should provide descriptive error for invalid values', () => {
      const result = JobStatusEnum.safeParse('invalid_status');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues).toHaveLength(1);
      }
    });

    it('should throw error when using parse with invalid value', () => {
      expect(() => JobStatusEnum.parse('invalid_status')).toThrow();
    });
  });
});