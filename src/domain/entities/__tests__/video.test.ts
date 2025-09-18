import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Video } from '../video';
import { VideoId } from '../../value-objects/video-id';
import { VideoName } from '../../value-objects/video-name';

describe('Video', () => {
  let mockVideoId: VideoId;
  let mockVideoName: VideoName;

  beforeEach(() => {
    mockVideoId = new VideoId();
    mockVideoName = new VideoName('test-video.mp4', 'test-id');
  });

  describe('constructor', () => {
    it('should create a video with provided id, name and current date', () => {
      const testDate = new Date('2024-01-01T00:00:00Z');

      const video = new Video(mockVideoId, mockVideoName, testDate);

      expect(video.getId()).toBe(mockVideoId);
      expect(video.getName()).toBe(mockVideoName);
      expect(video.getUploadDate()).toBe(testDate);
    });

    it('should create a video with current date when no date is provided', () => {
      const mockDate = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(mockDate);

      const video = new Video(mockVideoId, mockVideoName);
      expect(video.getUploadDate()).toEqual(mockDate);

      vi.useRealTimers();
    });
  });

  describe('getId', () => {
    it('should return the video id', () => {
      const video = new Video(mockVideoId, mockVideoName);

      const id = video.getId();
      expect(id).toBe(mockVideoId);
    });

    it('should return the same id when called multiple times', () => {
      const video = new Video(mockVideoId, mockVideoName);

      const id1 = video.getId();
      const id2 = video.getId();

      expect(id1).toBe(id2);
    });
  });

  describe('getName', () => {
    it('should return the video name object', () => {
      const video = new Video(mockVideoId, mockVideoName);

      const name = video.getName();

      expect(name).toBe(mockVideoName);
    });
  });

  describe('getUploadDate', () => {
    it('should return the upload date', () => {
      const testDate = new Date('2024-01-01T12:00:00Z');
      const video = new Video(mockVideoId, mockVideoName, testDate);

      const uploadDate = video.getUploadDate();

      expect(uploadDate).toBe(testDate);
    });

    it('should return the same date when called multiple times', () => {
      const video = new Video(mockVideoId, mockVideoName);

      const date1 = video.getUploadDate();
      const date2 = video.getUploadDate();

      expect(date1).toBe(date2);
    });
  });

  describe('getFileName', () => {
    it('should return the filename from video name value object', () => {
      const videoName = new VideoName('my-video.mp4', 'test-123');
      const video = new Video(mockVideoId, videoName);

      const fileName = video.getFileName();

      expect(fileName).toBe('my-video.mp4-test-123.mp4');
    });

    it('should delegate to VideoName getValue method', () => {
      const mockGetValue = vi.fn().mockReturnValue('mocked-filename.mp4');
      const videoNameMock = {
        getValue: mockGetValue
      } as unknown as VideoName;

      const video = new Video(mockVideoId, videoNameMock);

      const fileName = video.getFileName();

      expect(mockGetValue).toHaveBeenCalledOnce();
      expect(fileName).toBe('mocked-filename.mp4');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent values across multiple calls', () => {
      const video = new Video(mockVideoId, mockVideoName);

      const id1 = video.getId();
      const id2 = video.getId();
      const name1 = video.getName();
      const name2 = video.getName();

      expect(id1).toBe(id2);
      expect(name1).toBe(name2);
      expect(id1).toBe(mockVideoId);
      expect(name1).toBe(mockVideoName);
    });
  });
});