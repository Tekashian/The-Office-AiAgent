// Shared types between frontend and backend

export interface AgentTask {
  id: string;
  type: TaskType;
  description: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
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

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  AGENT = 'agent',
}
