import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Base Controller
 * Provides common response methods for all controllers
 */
export abstract class BaseController {
  /**
   * Send success response
   */
  protected success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      ...(message && { message }),
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send created response (201)
   */
  protected created<T>(res: Response, data: T, message?: string): void {
    this.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   */
  protected noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Get user ID from authenticated request
   * @throws {Error} if user is not authenticated
   */
  protected getUserId(req: AuthenticatedRequest): string {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  /**
   * Get pagination params from request
   */
  protected getPagination(req: AuthenticatedRequest): {
    page: number;
    limit: number;
    offset: number;
  } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Parse query param as array
   */
  protected parseArrayParam(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',');
    return [];
  }
}
