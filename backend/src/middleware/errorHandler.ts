import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Centralized Error Handler
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle known application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Handle Supabase errors
  if (err.name === 'PostgrestError') {
    statusCode = 400;
    message = 'Database operation failed';
  }

  // Handle axios errors
  if ((err as any).isAxiosError) {
    statusCode = 502;
    message = 'External API request failed';
  }

  // Log errors
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error Details:', {
      name: err.name,
      message: err.message,
      statusCode,
      isOperational,
      stack: err.stack,
    });
  } else {
    // Production: only log operational errors with less detail
    if (!isOperational) {
      console.error('🚨 CRITICAL ERROR:', {
        name: err.name,
        message: err.message,
        statusCode,
      });
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.name,
    }),
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};
