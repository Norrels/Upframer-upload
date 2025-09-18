import { describe, it, expect } from 'vitest';
import { VideoName } from '../video-name';

describe('VideoName', () => {
  const mockId = 'test-id-123';

  describe('constructor validation', () => {
    it('should create a valid video name with .mp4 extension', () => {
      const originalName = 'test-video.mp4';
      const videoName = new VideoName(originalName, mockId);

      expect(videoName.getValue()).toBe(`test-video.mp4-${mockId}.mp4`);
    });

    it('should throw error for empty filename', () => {
      const originalName = '';

      expect(() => new VideoName(originalName, mockId))
        .toThrow('Video name cannot be empty');
    });

    it('should throw error for whitespace-only filename', () => {
      const originalName = '   ';

      expect(() => new VideoName(originalName, mockId))
        .toThrow('Video name cannot be empty');
    });

    it('should throw error for non-mp4 files', () => {
      const originalName = 'test-video.avi';

      expect(() => new VideoName(originalName, mockId))
        .toThrow('Invalid file type. Only MP4 videos are allowed.');
    });

    it('should throw error for files without extension', () => {
      const originalName = 'test-video';

      expect(() => new VideoName(originalName, mockId))
        .toThrow('Invalid file type. Only MP4 videos are allowed.');
    });

    it('should accept uppercase MP4 extension', () => {
      const originalName = 'test-video.MP4';

      const videoName = new VideoName(originalName, mockId);

      expect(videoName.getValue()).toBe(`test-video.MP4-${mockId}.MP4`);
    });
  });

  describe('unique name generation', () => {
    it('should generate unique name by appending ID', () => {
      const originalName = 'my-video.mp4';
      const id = 'unique-123';

      const videoName = new VideoName(originalName, id);

      expect(videoName.getValue()).toBe('my-video.mp4-unique-123.mp4');
    });

    it('should handle complex filenames with spaces and special characters', () => {
      const originalName = 'My Video File (2024).mp4';
      const id = 'test-id';

      const videoName = new VideoName(originalName, id);

      expect(videoName.getValue()).toBe('My Video File (2024).mp4-test-id.mp4');
    });

    it('should preserve original extension in final name', () => {
      const originalName1 = 'video1.mp4';
      const originalName2 = 'video2.MP4';

      const videoName1 = new VideoName(originalName1, mockId);
      const videoName2 = new VideoName(originalName2, mockId);

      expect(videoName1.getValue()).toContain('.mp4');
      expect(videoName2.getValue()).toContain('.MP4');
    });
  });

  describe('getValue method', () => {
    it('should return the same value when called multiple times', () => {
      const videoName = new VideoName('test.mp4', mockId);

      const value1 = videoName.getValue();
      const value2 = videoName.getValue();

      expect(value1).toBe(value2);
    });

    it('should return a non-empty string', () => {
      const videoName = new VideoName('test.mp4', mockId);

      expect(videoName.getValue()).toBeTruthy();
      expect(videoName.getValue().length).toBeGreaterThan(0);
    });
  });
});