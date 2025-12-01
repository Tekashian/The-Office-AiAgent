/**
 * Centralized Configuration Management
 */

interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

interface AIConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
}

interface LogConfig {
  level: string;
}

class Config {
  private static instance: Config;

  public readonly server: ServerConfig;
  public readonly database: DatabaseConfig;
  public readonly ai: AIConfig;
  public readonly cache: CacheConfig;
  public readonly log: LogConfig;

  private constructor() {
    // Validate required environment variables
    this.validateEnv();

    // Server configuration
    this.server = {
      port: parseInt(process.env.PORT || '3001', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
    };

    // Database configuration
    this.database = {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    };

    // AI configuration
    this.ai = {
      apiKey: process.env.AI_API_KEY!,
      apiUrl: process.env.AI_API_URL!,
      model: process.env.AI_MODEL || 'gemini-2.5-flash',
    };

    // Cache configuration
    this.cache = {
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300000', 10),
    };

    // Log configuration
    this.log = {
      level: process.env.LOG_LEVEL || 'INFO',
    };
  }

  /**
   * Validate required environment variables
   */
  private validateEnv(): void {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'AI_API_KEY',
      'AI_API_URL',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file.'
      );
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.server.nodeEnv === 'development';
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.server.nodeEnv === 'production';
  }

  /**
   * Check if running in test
   */
  public isTest(): boolean {
    return this.server.nodeEnv === 'test';
  }

  /**
   * Get full configuration as object
   */
  public toJSON() {
    return {
      server: this.server,
      database: {
        url: this.database.url,
        // Don't expose keys
      },
      ai: {
        apiUrl: this.ai.apiUrl,
        model: this.ai.model,
        // Don't expose key
      },
      cache: this.cache,
      log: this.log,
    };
  }
}

export const config = Config.getInstance();