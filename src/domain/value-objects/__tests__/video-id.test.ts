import { describe, it, expect } from 'vitest';
import { VideoId } from '../video-id';

describe('VideoId', () => {
  it('should generate a valid UUID when created', () => {
    const videoId = new VideoId();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(videoId.getValue()).toMatch(uuidRegex);
  });

  it('should generate unique IDs for different instances', () => {
    const videoId1 = new VideoId();
    const videoId2 = new VideoId();

    expect(videoId1.getValue()).not.toBe(videoId2.getValue());
  });

  it('should return the same value when getValue is called multiple times', () => {
    const videoId = new VideoId();

    const value1 = videoId.getValue();
    const value2 = videoId.getValue();

    expect(value1).toBe(value2);
  });

  it('should return a non-empty string', () => {
    const videoId = new VideoId();

    expect(videoId.getValue()).toBeTruthy();
    expect(videoId.getValue().length).toBeGreaterThan(0);
  });
});