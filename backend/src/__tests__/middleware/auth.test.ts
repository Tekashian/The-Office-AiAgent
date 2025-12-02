import { Response, NextFunction } from 'express';
import { authenticateUser, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';
import { supabase } from '../../config/supabase';

// Mock Supabase
jest.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await authenticateUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe('user-123');
      expect(mockRequest.userEmail).toBe('test@example.com');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      await authenticateUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No authorization token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject invalid token format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token-here',
      };

      await authenticateUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      });

      await authenticateUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle Supabase errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };

      (supabase.auth.getUser as jest.Mock).mockRejectedValue(
        new Error('Supabase connection error')
      );

      await authenticateUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user info if token is valid', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'optional@example.com',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe('user-456');
      expect(mockRequest.userEmail).toBe('optional@example.com');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without error if token is missing', async () => {
      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without error if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
