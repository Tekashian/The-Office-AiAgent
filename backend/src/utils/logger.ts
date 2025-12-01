/**
 * Logger Service
 * Structured logging with different levels and formatting
 */

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
    this.level = LogLevel[envLevel as keyof typeof LogLevel] || LogLevel.INFO;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format log message with timestamp and metadata
   */
  private format(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const meta = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    
    if (this.isDevelopment) {
      return `${timestamp} [${level}] ${message}${meta}`;
    }
    
    // Production: JSON format for log aggregation
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...metadata,
    });
  }

  /**
   * Check if log level should be printed
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMeta = error ? {
        error: error.message || error,
        stack: error.stack,
        ...metadata,
      } : metadata;
      
      console.error(this.format(LogLevel.ERROR, message, errorMeta));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format(LogLevel.WARN, message, metadata));
    }
  }

  /**
   * Log info messages
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format(LogLevel.INFO, message, metadata));
    }
  }

  /**
   * Log debug messages (only in development or if LOG_LEVEL=DEBUG)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.format(LogLevel.DEBUG, message, metadata));
    }
  }

  /**
   * Log HTTP request
   */
  http(method: string, path: string, statusCode: number, duration: number, metadata?: LogMetadata): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    if (this.shouldLog(level)) {
      const message = `${method} ${path} ${statusCode} ${duration}ms`;
      const logMethod = level === LogLevel.ERROR ? console.error : 
                       level === LogLevel.WARN ? console.warn : console.log;
      
      logMethod(this.format(level, message, metadata));
    }
  }

  /**
   * Create child logger with persistent metadata
   */
  child(metadata: LogMetadata): ChildLogger {
    return new ChildLogger(this, metadata);
  }
}

/**
 * Child Logger with persistent metadata
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private metadata: LogMetadata
  ) {}

  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    this.parent.error(message, error, { ...this.metadata, ...metadata });
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.parent.warn(message, { ...this.metadata, ...metadata });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.parent.info(message, { ...this.metadata, ...metadata });
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.parent.debug(message, { ...this.metadata, ...metadata });
  }
}

export const logger = new Logger();