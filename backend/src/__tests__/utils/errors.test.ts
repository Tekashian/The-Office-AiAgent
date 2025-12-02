import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
} from '../../utils/errors';

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create error with correct status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create error with correct status code', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('AuthorizationError', () => {
    it('should create error with correct status code', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with correct status code', () => {
      const error = new NotFoundError('Resource');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ConflictError', () => {
    it('should create error with correct status code', () => {
      const error = new ConflictError('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('RateLimitError', () => {
    it('should create error with correct status code', () => {
      const error = new RateLimitError('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests');
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('ExternalServiceError', () => {
    it('should create error with service name and message', () => {
      const error = new ExternalServiceError('Gemini AI', 'API rate limit exceeded');
      expect(error.statusCode).toBe(502);
      expect(error.message).toBe('API rate limit exceeded');
      expect(error.name).toBe('ExternalServiceError');
    });

    it('should create error with default message', () => {
      const error = new ExternalServiceError('Gemini AI');
      expect(error.message).toBe('External service error: Gemini AI');
    });
  });

  describe('AppError', () => {
    it('should be instance of Error', () => {
      const error = new ValidationError('test');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should preserve stack trace', () => {
      const error = new ValidationError('test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });
});
