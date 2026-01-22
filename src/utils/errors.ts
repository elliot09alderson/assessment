import { IAppError } from '../interfaces/index.js';

// Custom application error class
export class AppError extends Error implements IAppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const NotFoundError = (resource: string = 'Resource') =>
  new AppError(`${resource} not found`, 404, 'NOT_FOUND');

export const BadRequestError = (message: string) =>
  new AppError(message, 400, 'BAD_REQUEST');

export const ValidationError = (message: string, details?: unknown) => {
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  (error as any).details = details;
  return error;
};

export const ConflictError = (message: string) =>
  new AppError(message, 409, 'CONFLICT');

export const ExternalApiError = (message: string) =>
  new AppError(message, 502, 'EXTERNAL_API_ERROR');

export const RateLimitError = () =>
  new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');

export const ServiceUnavailableError = (message: string = 'Service temporarily unavailable') =>
  new AppError(message, 503, 'SERVICE_UNAVAILABLE');
