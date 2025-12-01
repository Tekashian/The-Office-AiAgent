/**
 * Performance Monitoring Utilities
 */

import { logger } from './logger';

/**
 * Measure function execution time
 */
export async function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    logger.debug(`${name} completed`, { duration });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${name} failed`, error, { duration });
    throw error;
  }
}

/**
 * Performance timer decorator
 */
export function timed(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const className = target.constructor.name;
    const methodName = `${className}.${propertyKey}`;
    
    return measureTime(methodName, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
} {
  const usage = process.memoryUsage();
  
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
  };
}

/**
 * Log memory usage
 */
export function logMemoryUsage(): void {
  const usage = getMemoryUsage();
  
  logger.debug('Memory usage', {
    heapUsedMB: usage.heapUsed,
    heapTotalMB: usage.heapTotal,
    externalMB: usage.external,
    rssMB: usage.rss,
  });
}

/**
 * Start periodic memory monitoring
 */
export function startMemoryMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(logMemoryUsage, intervalMs);
}