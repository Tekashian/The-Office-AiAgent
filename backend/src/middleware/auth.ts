import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticationError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Authentication Middleware
 * Validates JWT token and attaches user info to request
 * @throws {AuthenticationError} if token is invalid or missing
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('No authorization token provided');
    }

    const user = await validateToken(token);

    // Attach user info to request
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional Authentication Middleware
 * Adds user info if token is present but doesn't block if missing
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const user = await validateToken(token);
      req.userId = user.id;
      req.userEmail = user.email;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Extract JWT token from Authorization header
 * @private
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Validate JWT token with Supabase
 * @private
 * @throws {AuthenticationError} if token is invalid
 */
async function validateToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthenticationError('Invalid or expired token');
  }

  return user;
}
