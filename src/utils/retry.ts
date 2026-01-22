import { logger } from './logger.js';

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown) => boolean;
}

/**
 * Executes a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs = 30000,
    backoffFactor = 2,
    retryCondition = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt > maxRetries || !retryCondition(error)) {
        throw error;
      }

      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        nextAttempt: attempt + 1,
        maxRetries,
      });

      await sleep(delay);
      delay = Math.min(delay * backoffFactor, maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a retryable network error
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const retryableMessages = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'timeout',
      'socket hang up',
    ];
    
    return retryableMessages.some((msg) =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
  return false;
}

/**
 * Check if HTTP status code indicates rate limiting
 */
export function isRateLimitError(statusCode: number): boolean {
  return statusCode === 429;
}

/**
 * Check if HTTP status code is retryable
 */
export function isRetryableStatusCode(statusCode: number): boolean {
  return statusCode >= 500 || statusCode === 429;
}
