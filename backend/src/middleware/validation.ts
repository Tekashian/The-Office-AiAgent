import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validation Middleware Factory
 * Creates middleware for validating request body/params/query against Zod schemas
 */
export const validate = (
  schema: ZodSchema,
  property: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req[property]);
      req[property] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        next(new ValidationError(errorMessage));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Common Validation Schemas
 */
export const commonSchemas = {
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),

  email: z.object({
    email: z.string().email('Invalid email address'),
  }),

  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};
