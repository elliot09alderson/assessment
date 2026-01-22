import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { IApiResponse } from '../interfaces/index.js';
import { config } from '../config/index.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = (error as any).details;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: error.message,
      stack: error.stack,
      code,
    });
  } else {
    logger.warn('Client error', {
      error: error.message,
      code,
    });
  }

  // Send response
  const response: IApiResponse = {
    success: false,
    message,
    error: {
      code,
      details: config.nodeEnv === 'development' ? details || error.stack : details,
    },
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: IApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    error: {
      code: 'ROUTE_NOT_FOUND',
    },
  };

  res.status(404).json(response);
};
