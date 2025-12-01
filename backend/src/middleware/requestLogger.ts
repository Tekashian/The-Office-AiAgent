import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Request Logging Middleware
 * Logs HTTP requests with timing and correlation IDs
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Generate correlation ID for request tracing
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request start
  logger.debug('Incoming request', {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.http(
      req.method,
      req.path,
      res.statusCode,
      duration,
      {
        correlationId,
        userId: (req as any).userId,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      }
    );

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Response Time Header Middleware
 * Adds X-Response-Time header
 */
export const responseTime = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Override res.send to capture timing before sending
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalSend.call(this, data);
  };

  next();
};