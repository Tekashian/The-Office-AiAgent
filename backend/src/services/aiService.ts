import axios from 'axios';
import { AIRequest, AIResponse } from '../types';

export class AIService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.apiUrl = process.env.AI_API_URL || '';
  }

  /**
   * Send a request to AI API
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      if (!this.apiKey || !this.apiUrl) {
        throw new Error('AI API credentials not configured');
      }

      const response = await axios.post(
        this.apiUrl,
        {
          prompt: request.prompt,
          context: request.context,
          model: request.model || 'default',
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        content: response.data.content || response.data.text || '',
        model: response.data.model || request.model || 'default',
        tokensUsed: response.data.tokens_used || response.data.usage?.total_tokens,
      };
    } catch (error) {
      console.error('AI API request failed:', error);
      throw error;
    }
  }

  /**
   * Process a task with AI
   */
  async processTask(taskDescription: string, context?: any): Promise<string> {
    const response = await this.sendRequest({
      prompt: taskDescription,
      context,
    });
    return response.content;
  }

  /**
   * Analyze text with AI
   */
  async analyzeText(text: string, analysisType: string): Promise<any> {
    const prompt = `Analyze the following text for ${analysisType}:\n\n${text}`;
    const response = await this.sendRequest({ prompt });
    return response.content;
  }
}

export default new AIService();
