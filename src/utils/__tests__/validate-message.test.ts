import { describe, it, expect } from 'vitest';
import { validateMessage } from '../validate-message';

describe('validateMessage', () => {
  describe('valid JSON inputs', () => {
    it('should parse valid JSON string successfully', () => {
      const validJson = '{"name": "test", "value": 123}';
      const result = validateMessage(validJson);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse JSON array successfully', () => {
      const validJsonArray = '[1, 2, 3, "test"]';
      const result = validateMessage(validJsonArray);
      expect(result).toEqual([1, 2, 3, 'test']);
    });

    it('should parse simple JSON values', () => {
      expect(validateMessage('"string"')).toBe('string');
      expect(validateMessage('123')).toBe(123);
      expect(validateMessage('true')).toBe(true);
      expect(validateMessage('false')).toBe(false);
      expect(validateMessage('null')).toBeNull();
    });

    it('should parse complex nested JSON object', () => {
      const complexJson = JSON.stringify({
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            settings: {
              notifications: true,
              theme: 'dark'
            }
          }
        },
        items: [1, 2, 3]
      });

      const result = validateMessage(complexJson);
      expect(result).toEqual({
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            settings: {
              notifications: true,
              theme: 'dark'
            }
          }
        },
        items: [1, 2, 3]
      });
    });

    it('should handle empty JSON object', () => {
      const emptyObject = '{}';
      const result = validateMessage(emptyObject);
      expect(result).toEqual({});
    });

    it('should handle empty JSON array', () => {
      const emptyArray = '[]';
      const result = validateMessage(emptyArray);
      expect(result).toEqual([]);
    });
  });

  describe('invalid JSON inputs', () => {
    it('should throw error for malformed JSON', () => {
      const malformedJson = '{"name": "test", "value":}';

      expect(() => validateMessage(malformedJson))
        .toThrow('Invalid JSON message:');
    });

    it('should throw error for incomplete JSON object', () => {
      const incompleteJson = '{"name": "test"';

      expect(() => validateMessage(incompleteJson))
        .toThrow('Invalid JSON message:');
    });

    it('should throw error for invalid characters', () => {
      const invalidChars = '{"name": test}'; 

      expect(() => validateMessage(invalidChars))
        .toThrow('Invalid JSON message:');
    });

    it('should throw error for empty string', () => {
      const emptyString = '';

      expect(() => validateMessage(emptyString))
        .toThrow('Invalid JSON message:');
    });

    it('should throw error for non-JSON string', () => {
      const nonJsonString = 'this is not json';

      expect(() => validateMessage(nonJsonString))
        .toThrow('Invalid JSON message:');
    });

    it('should throw error for unquoted strings', () => {
      const unquotedString = 'hello world';

      expect(() => validateMessage(unquotedString))
        .toThrow('Invalid JSON message:');
    });
  });

  describe('edge cases', () => {
    it('should handle JSON with special characters', () => {
      const specialCharsJson = '{"emoji": "🎥", "unicode": "café"}';

      const result = validateMessage(specialCharsJson);

      expect(result).toEqual({ emoji: '🎥', unicode: 'café' });
    });

    it('should handle JSON with escaped characters', () => {
      const escapedJson = '{"path": "C:\\\\Users\\\\test", "quote": "\\"hello\\""}';

      const result = validateMessage(escapedJson);

      expect(result).toEqual({
        path: 'C:\\Users\\test',
        quote: '"hello"'
      });
    });

    it('should preserve number precision', () => {
      const numbersJson = '{"integer": 42, "float": 3.14159, "negative": -100}';
      const result = validateMessage(numbersJson);

      expect(result).toEqual({
        integer: 42,
        float: 3.14159,
        negative: -100
      });
    });
  });
});