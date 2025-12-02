// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger, responseTime } from './middleware/requestLogger';
import { rateLimit, rateLimitPresets } from './middleware/rateLimit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { startMemoryMonitoring } from './utils/performance';
import agentRoutes from './routes/agentRoutes';
import emailRoutes from './routes/emailRoutes';
import emailInboxRoutes from './routes/emailInboxRoutes';
import emailConfigRoutes from './routes/emailConfigRoutes';
import emailTemplateRoutes from './routes/emailTemplateRoutes';
import pdfRoutes from './routes/pdfRoutes';
import scraperRoutes from './routes/scraperRoutes';
import cronRoutes from './routes/cronRoutes';
import aiRoutes from './routes/aiRoutes';
import userContextRoutes from './routes/userContextRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import searchRoutes from './routes/searchRoutes';

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.isProduction(),
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging and timing
app.use(responseTime);
app.use(requestLogger);

// Global rate limiting (relaxed)
app.use(rateLimit(rateLimitPresets.relaxed));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Office Agent API is running',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// API Routes with specific rate limits
app.use('/api/agent', agentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-inbox', emailInboxRoutes);
app.use('/api/email-config', emailConfigRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/ai', rateLimit(rateLimitPresets.ai), aiRoutes); // Stricter limit for AI
app.use('/api/user/context', userContextRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(config.server.port, () => {
  logger.info('Server started successfully', {
    port: config.server.port,
    environment: config.server.nodeEnv,
    nodeVersion: process.version,
  });
  
  logger.info('Features enabled', {
    helmet: '✓ Security headers',
    compression: '✓ Response compression',
    rateLimit: '✓ Rate limiting',
    requestLogging: '✓ Request logging',
    correlationIds: '✓ Request tracing',
  });

  // Start memory monitoring in production
  if (config.isProduction()) {
    startMemoryMonitoring(300000); // Every 5 minutes
    logger.info('Memory monitoring enabled');
  }
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  // Give ongoing requests 10 seconds to complete
  setTimeout(() => {
    logger.info('Forcing shutdown');
    process.exit(0);
  }, 10000);
  
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', reason);
  process.exit(1);
});

export default app;