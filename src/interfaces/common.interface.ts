import { Request, Response, NextFunction } from 'express';

// API response structure
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

// Sync result interface
export interface ISyncResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{
    shipmentId: string;
    error: string;
  }>;
  duration: number;
}

// Async request handler type
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Error with status code
export interface IAppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}
