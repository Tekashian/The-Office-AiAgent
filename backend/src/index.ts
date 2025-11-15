// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import agentRoutes from './routes/agentRoutes';
import emailRoutes from './routes/emailRoutes';
import emailConfigRoutes from './routes/emailConfigRoutes';
import emailInboxRoutes from './routes/emailInboxRoutes';
import pdfRoutes from './routes/pdfRoutes';
import scraperRoutes from './routes/scraperRoutes';
import cronRoutes from './routes/cronRoutes';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Office Agent API is running' });
});

// API Routes
app.use('/api/agent', agentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-config', emailConfigRoutes);
app.use('/api/email-inbox', emailInboxRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/cron', cronRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;