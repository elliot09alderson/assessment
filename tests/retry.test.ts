import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { withRetry, sleep, isRetryableError, isRetryableStatusCode } from '../src/utils/retry.js';

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 3,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries exceeded', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        withRetry(mockFn, {
          maxRetries: 2,
          initialDelayMs: 10,
        })
      ).rejects.toThrow('Always fails');

      expect(mockFn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should respect retryCondition', async () => {
      const nonRetryableError = new Error('Non-retryable');
      const mockFn = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(
        withRetry(mockFn, {
          maxRetries: 3,
          initialDelayMs: 10,
          retryCondition: () => false, // Never retry
        })
      ).rejects.toThrow('Non-retryable');

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(mockFn, {
        maxRetries: 3,
        initialDelayMs: 50,
        backoffFactor: 2,
      });
      const duration = Date.now() - startTime;

      // Should have waited at least 50ms + 100ms = 150ms
      expect(duration).toBeGreaterThanOrEqual(140);
    });

    it('should respect maxDelayMs', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 50, // Less than initial delay
        backoffFactor: 2,
      });
      const duration = Date.now() - startTime;

      // Should cap at maxDelayMs
      expect(duration).toBeGreaterThanOrEqual(45);
      expect(duration).toBeLessThan(150);
    });
  });

  describe('sleep', () => {
    it('should wait for specified duration', async () => {
      const startTime = Date.now();
      await sleep(100);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(95);
      expect(duration).toBeLessThan(150);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('socket hang up'))).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isRetryableError(new Error('Not found'))).toBe(false);
      expect(isRetryableError(new Error('Invalid input'))).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('isRetryableStatusCode', () => {
    it('should return true for 5xx errors', () => {
      expect(isRetryableStatusCode(500)).toBe(true);
      expect(isRetryableStatusCode(502)).toBe(true);
      expect(isRetryableStatusCode(503)).toBe(true);
      expect(isRetryableStatusCode(504)).toBe(true);
    });

    it('should return true for 429 rate limit', () => {
      expect(isRetryableStatusCode(429)).toBe(true);
    });

    it('should return false for 4xx errors (except 429)', () => {
      expect(isRetryableStatusCode(400)).toBe(false);
      expect(isRetryableStatusCode(401)).toBe(false);
      expect(isRetryableStatusCode(404)).toBe(false);
    });

    it('should return false for 2xx success codes', () => {
      expect(isRetryableStatusCode(200)).toBe(false);
      expect(isRetryableStatusCode(201)).toBe(false);
    });
  });
});
