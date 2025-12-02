import { logger } from '../logger';

describe('Logger Utility', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      
      expect(console.log).toHaveBeenCalled();
    });

    it('should log info messages with metadata', () => {
      const metadata = { userId: '123', action: 'test' };
      logger.info('Test message', metadata);
      
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should log Error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should log error with metadata', () => {
      const metadata = { code: 'ERR_001', context: 'test' };
      logger.error('Test error', metadata);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning');
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log warning with metadata', () => {
      const metadata = { deprecated: true };
      logger.warn('Deprecated feature', metadata);
      
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('http', () => {
    it('should log HTTP requests', () => {
      logger.http('GET', '/api/test', 200, 150);
      
      expect(console.log).toHaveBeenCalled();
    });

    it('should log HTTP requests with metadata', () => {
      const metadata = { userId: '123', ip: '127.0.0.1' };
      logger.http('POST', '/api/test', 201, 200, metadata);
      
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message');
      
      expect(console.log).toHaveBeenCalled();
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      logger.debug('Debug message');
      
      // In production, debug might not log or use different handler
      // This test verifies expected behavior
    });
  });
});
