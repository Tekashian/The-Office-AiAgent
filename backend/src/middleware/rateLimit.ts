import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';

/**
 * Rate Limiter Configuration
 */
interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Rate Limit Store
 */
interface RateLimitStore {
  requests: number;
  resetAt: number;
}

/**
 * In-Memory Rate Limiter
 * For production, consider using Redis
 */
class RateLimiter {
  private store: Map<string, RateLimitStore>;
  private windowMs: number;
  private maxRequests: number;
  private message: string;
  private keyGenerator: (req: Request) => string;

  constructor(config: RateLimiterConfig) {
    this.store = new Map();
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
    this.message = config.message || 'Too many requests, please try again later';
    this.keyGenerator = config.keyGenerator || this.defaultKeyGenerator;

    // Clean old entries every minute
    setInterval(() => this.cleanExpired(), 60000);
  }

  /**
   * Default key generator (IP-based)
   */
  private defaultKeyGenerator(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';
    return `ratelimit:${ip}`;
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    
    for (const [key, store] of this.store.entries()) {
      if (now > store.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Middleware handler
   */
  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.keyGenerator(req);
    const now = Date.now();
    const store = this.store.get(key);

    // No existing record or expired
    if (!store || now > store.resetAt) {
      this.store.set(key, {
        requests: 1,
        resetAt: now + this.windowMs,
      });

      this.setHeaders(res, 1, this.maxRequests, now + this.windowMs);
      next();
      return;
    }

    // Increment request count
    store.requests++;

    // Check if limit exceeded
    if (store.requests > this.maxRequests) {
      this.setHeaders(res, store.requests, this.maxRequests, store.resetAt);
      
      const error = new RateLimitError(this.message);
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        retryAfter: Math.ceil((store.resetAt - now) / 1000),
      });
      return;
    }

    this.setHeaders(res, store.requests, this.maxRequests, store.resetAt);
    next();
  };

  /**
   * Set rate limit headers
   */
  private setHeaders(
    res: Response,
    current: number,
    limit: number,
    resetAt: number
  ): void {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString());
  }
}

/**
 * Create rate limiter middleware
 */
export function rateLimit(config: RateLimiterConfig) {
  const limiter = new RateLimiter(config);
  return limiter.middleware;
}

/**
 * Preset configurations
 */
export const rateLimitPresets = {
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60000,
    maxRequests: 10,
  },

  // Standard: 100 requests per minute
  standard: {
    windowMs: 60000,
    maxRequests: 100,
  },

  // Relaxed: 1000 requests per 15 minutes
  relaxed: {
    windowMs: 900000,
    maxRequests: 1000,
  },

  // AI endpoints: 20 requests per minute (expensive operations)
  ai: {
    windowMs: 60000,
    maxRequests: 20,
    message: 'AI request limit exceeded, please try again later',
  },

  // Auth endpoints: 5 requests per 15 minutes
  auth: {
    windowMs: 900000,
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
  },
};