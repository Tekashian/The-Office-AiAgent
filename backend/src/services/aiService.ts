import axios from 'axios';
import { AIRequestConfig, AIResponseData } from '../types/ai.types';
import { ExternalServiceError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import userContextService from './userContextService';
import { supabase } from '../config/supabase';

/**
 * AI Service
 * Handles communication with Gemini AI API
 */
class AIService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = config.ai.apiKey;
    this.apiUrl = config.ai.apiUrl;
    this.model = config.ai.model;

    this.logInitialization();
  }

  /**
   * Log initialization details
   * @private
   */
  private logInitialization(): void {
    logger.info('AIService initialized', {
      apiUrl: this.apiUrl,
      model: this.model,
      apiKeyConfigured: !!this.apiKey,
    });
  }

  /**
   * Send request to Gemini AI API
   */
  async sendRequest(config: AIRequestConfig): Promise<AIResponseData> {
    try {
      let prompt = config.prompt;

      // Add user context if requested
      if (config.userId && config.includeContext !== false) {
        const userContext = await userContextService.getUserContext(config.userId);
        if (userContext) {
          prompt = userContext + prompt;
        }
      }

      // Build Gemini API request
      const requestBody = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxTokens || 2000,
          topP: 0.95,
          topK: 40,
        },
      };

      // Call Gemini API
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        timeout: 30000, // 30 second timeout
      });

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError(error);
      throw error; // TypeScript requires this after handleError
    }
  }

  /**
   * Parse Gemini API response
   * @private
   * @throws {ExternalServiceError} if response is invalid or blocked
   */
  private parseResponse(data: any): AIResponseData {
    // Check for safety blocking
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      logger.warn('Content blocked by Gemini safety filters');
      throw new ExternalServiceError(
        'Gemini AI',
        'Content blocked by safety filters'
      );
    }

    // Extract generated text
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!content) {
      logger.error('Empty response from Gemini AI', { candidates: data.candidates });
      throw new ExternalServiceError('Gemini AI', 'Empty response from AI service');
    }

    logger.debug('AI response parsed successfully', {
      contentLength: content.length,
      finishReason: data.candidates?.[0]?.finishReason,
    });

    return {
      content,
      finishReason: data.candidates?.[0]?.finishReason,
    };
  }

  /**
   * Handle API errors
   * @private
   */
  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error?.message || error.message;

      logger.error('AI API error', error, { status, message: errorMessage });

      if (status === 400) {
        throw new ValidationError(`AI API error: ${errorMessage}`);
      }
      if (status === 401 || status === 403) {
        throw new ExternalServiceError('Gemini AI', 'Authentication failed');
      }
      if (status === 429) {
        throw new ExternalServiceError('Gemini AI', 'Rate limit exceeded');
      }

      throw new ExternalServiceError('Gemini AI', errorMessage);
    }

    logger.error('Unknown AI error', error);
    throw new ExternalServiceError('Gemini AI', 'Unknown error occurred');
  }

  /**
   * Generate text based on prompt
   */
  async generateText(prompt: string, userId?: string): Promise<string> {
    const response = await this.sendRequest({
      prompt,
      userId,
      includeContext: true,
    });

    return response.content;
  }

  /**
   * Process a task with AI
   */
  async processTask(description: string, context?: string): Promise<string> {
    const prompt = context
      ? `Task: ${description}\nContext: ${context}`
      : `Task: ${description}`;

    const response = await this.sendRequest({
      prompt,
      includeContext: false,
    });

    return response.content;
  }

  /**
   * Analyze text with AI
   */
  async analyzeText(text: string, analysisType: string): Promise<string> {
    const prompt = `Analyze the following text for ${analysisType}:\n\n${text}`;

    const response = await this.sendRequest({
      prompt,
      includeContext: false,
    });

    return response.content;
  }

  /**
   * Generate content with specific configuration
   */
  async generate(config: {
    prompt: string;
    type?: string;
    userId?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const response = await this.sendRequest({
      prompt: config.prompt,
      userId: config.userId,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      includeContext: true,
    });

    return response.content;
  }

  /**
   * Chat with AI (conversational)
   */
  async chat(message: string, conversationHistory: any[]): Promise<string> {
    const historyContext = conversationHistory
      .slice(-5) // Last 5 messages for context
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nUser: ${message}`
      : `User: ${message}`;

    const response = await this.sendRequest({
      prompt,
      includeContext: false,
    });

    return response.content;
  }

  /**
   * Get user context for AI
   */
  async getUserContext(userId: string): Promise<string> {
    try {
      logger.debug('Fetching user context', { userId });

      const { data, error } = await supabase
        .from('user_context')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.warn('No user context found', { userId, error: error.message });
        return '';
      }

      const context = [
        data.full_name ? `Name: ${data.full_name}` : '',
        data.role ? `Role: ${data.role}` : '',
        data.department ? `Department: ${data.department}` : '',
        data.preferences ? `Preferences: ${JSON.stringify(data.preferences)}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      logger.debug('User context retrieved', { userId, contextLength: context.length });
      return context;
    } catch (error) {
      logger.error('Error fetching user context', error, { userId });
      return '';
    }
  }

  /**
   * Generate email template with AI
   */
  async generateEmailTemplate(params: {
    subject: string;
    purpose: string;
    tone?: string;
    variables?: string[];
  }): Promise<string> {
    const { subject, purpose, tone = 'professional', variables = [] } = params;

    const prompt = `Generate an email template with the following specifications:
Subject: ${subject}
Purpose: ${purpose}
Tone: ${tone}
${variables.length > 0 ? `Variables to include: ${variables.join(', ')}` : ''}

Create a professional email template that includes placeholders for personalization.
Format variables as {{variableName}}.`;

    const response = await this.sendRequest({
      prompt,
      includeContext: false,
    });

    return response.content;
  }

  /**
   * Generate professional email body (ready to send, no placeholders)
   */
  async generateProfessionalEmail(params: {
    subject: string;
    message: string;
    tone?: string;
    senderName?: string;
    senderPosition?: string;
    company?: string;
    recipientName?: string;
  }): Promise<string> {
    const { 
      subject, 
      message, 
      tone = 'professional',
      senderName,
      senderPosition,
      company,
      recipientName 
    } = params;

    const contextParts: string[] = [];
    if (recipientName) contextParts.push(`Odbiorca: ${recipientName}`);
    if (senderName) contextParts.push(`Nadawca: ${senderName}`);
    if (senderPosition) contextParts.push(`Stanowisko nadawcy: ${senderPosition}`);
    if (company) contextParts.push(`Firma: ${company}`);

    const prompt = `Wygeneruj profesjonalny email w języku polskim na podstawie poniższych informacji:

Temat: ${subject}
Główna treść/cel: ${message}
Ton: ${tone}
${contextParts.length > 0 ? `\nKontekst:\n${contextParts.join('\n')}` : ''}

WAŻNE ZASADY:
1. Użyj odpowiedniego powitania (np. "Szanowni Państwo", "Szanowna Pani/Panie" jeśli znasz imię)
2. Napisz treść emaila w formalnym, profesjonalnym stylu
3. Zakończ odpowiednim pozdrowieniem (np. "Z poważaniem", "Pozdrawiam")
4. NIE używaj placeholderów typu {{nazwa}} - wpisz konkretne wartości lub pomiń
5. Email powinien być gotowy do wysłania
6. Formatuj w sposób czytelny z odpowiednimi akapitami
7. Jeśli nie znasz imienia odbiorcy, użyj ogólnego powitania

Wygeneruj TYLKO treść emaila (bez tematu, będzie dodany osobno):`;

    const response = await this.sendRequest({
      prompt,
      includeContext: false,
      temperature: 0.7,
    });

    return response.content;
  }
}

export default new AIService();
