import { logger } from '../../utils/logger';

describe('Logger Utility', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('info', () => {
    it('should log info messages without throwing', () => {
      expect(() => logger.info('Test info message')).not.toThrow();
    });

    it('should log info messages with metadata without throwing', () => {
      const metadata = { userId: '123', action: 'test' };
      expect(() => logger.info('Test message', metadata)).not.toThrow();
    });
  });

  describe('error', () => {
    it('should log error messages without throwing', () => {
      expect(() => logger.error('Test error message')).not.toThrow();
    });

    it('should log Error objects without throwing', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error occurred', error)).not.toThrow();
    });

    it('should log error with metadata without throwing', () => {
      const metadata = { code: 'ERR_001', context: 'test' };
      expect(() => logger.error('Test error', metadata)).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should log warning messages without throwing', () => {
      expect(() => logger.warn('Test warning')).not.toThrow();
    });

    it('should log warning with metadata without throwing', () => {
      const metadata = { deprecated: true };
      expect(() => logger.warn('Deprecated feature', metadata)).not.toThrow();
    });
  });

  describe('http', () => {
    it('should log HTTP requests without throwing', () => {
      expect(() => logger.http('GET', '/api/test', 200, 150)).not.toThrow();
    });

    it('should log HTTP requests with metadata without throwing', () => {
      const metadata = { userId: '123', ip: '127.0.0.1' };
      expect(() => logger.http('POST', '/api/test', 201, 200, metadata)).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should log debug messages in development without throwing', () => {
      process.env.NODE_ENV = 'development';
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('should handle debug messages in production without throwing', () => {
      process.env.NODE_ENV = 'production';
      expect(() => logger.debug('Debug message')).not.toThrow();
    });
  });

  describe('environment handling', () => {
    it('should work in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(() => {
        logger.info('Test');
        logger.error('Test');
        logger.warn('Test');
        logger.debug('Test');
      }).not.toThrow();
    });
  });
});
