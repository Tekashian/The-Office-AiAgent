/**
 * User Context Interface
 * Represents user profile data for AI context
 */
export interface UserContext {
  userId: string;
  fullName?: string;
  jobTitle?: string;
  department?: string;
  company?: string;
  companyDescription?: string;
  workDescription?: string;
  aiContextNotes?: string;
  preferences?: {
    communicationTone?: 'professional' | 'friendly-professional' | 'casual' | 'formal' | 'friendly';
    language?: string;
  };
}

/**
 * AI Request Configuration
 */
export interface AIRequestConfig {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  includeContext?: boolean;
}

/**
 * AI Response Interface
 */
export interface AIResponseData {
  content: string;
  finishReason?: string;
  tokensUsed?: number;
  model?: string;
}
