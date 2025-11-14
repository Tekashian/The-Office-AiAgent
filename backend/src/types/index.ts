// AI Agent Types
export interface AgentTask {
  id: string;
  type: TaskType;
  description: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export enum TaskType {
  EMAIL = 'email',
  PDF_GENERATION = 'pdf_generation',
  WEB_SCRAPING = 'web_scraping',
  SCHEDULED = 'scheduled',
  AI_REQUEST = 'ai_request',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Email Types
export interface EmailConfig {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
}

// PDF Types
export interface PDFGenerationOptions {
  title?: string;
  author?: string;
  subject?: string;
  outputPath?: string;
}

// Web Scraping Types
export interface ScrapingConfig {
  url: string;
  selectors?: Record<string, string>;
  waitFor?: number;
}

// AI API Types
export interface AIRequest {
  prompt: string;
  context?: any;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed?: number;
}

// Cron Job Types
export interface CronJobConfig {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  enabled: boolean;
}
