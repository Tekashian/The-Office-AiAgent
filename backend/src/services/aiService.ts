import axios from 'axios';
import { AIRequest, AIResponse } from '../types';

export class AIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.apiUrl = process.env.AI_API_URL || '';
    this.model = process.env.AI_MODEL || 'gemini-2.5-flash';
    
    // Debug logging
    console.log('🔧 AIService initialized:');
    console.log('  - API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('  - API URL:', this.apiUrl || 'NOT SET');
    console.log('  - Model:', this.model);
  }

  /**
   * Send a request to Gemini AI API
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      if (!this.apiKey || !this.apiUrl) {
        throw new Error('Gemini API credentials not configured');
      }

      // Gemini API expects this structure
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: request.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 1000,
        },
      };

      // Gemini uses header-based authentication
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
      });

      // Extract text from Gemini response structure
      const generatedText =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content: generatedText,
        model: this.model,
        tokensUsed: response.data.usageMetadata?.totalTokenCount,
      };
    } catch (error) {
      console.error('Gemini API request failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
      }
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

  /**
   * Chat with conversation history (multi-turn)
   */
  async chat(
    currentMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>
  ): Promise<string> {
    try {
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach((msg) => {
          contents.push({
            role: msg.role,
            parts: [{ text: msg.text }],
          });
        });
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: currentMessage }],
      });

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      };

      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
      });

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini chat request failed:', error);
      throw error;
    }
  }

  /**
   * Generate email template based on category
   */
  async generateEmailTemplate(category: string, additionalContext?: string): Promise<{ subject: string; body: string }> {
    try {
      const prompt = `Generate a SHORT professional email template for the category: "${category}".
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- Create a subject line in Polish that fits the category
- Create a SHORT professional email body in Polish (max 3-4 sentences)
- Use placeholders like {{name}}, {{company}}, {{date}} where appropriate
- Keep it VERY concise and professional

Return ONLY a JSON object with this EXACT structure (NO markdown, NO code blocks, NO extra text):
{
  "subject": "krótki temat",
  "body": "Krótka treść emaila.\\n\\nPozdrowienia"
}

CRITICAL: Response must be VALID JSON ONLY. Keep body SHORT (max 150 words).`;

      const response = await this.sendRequest({
        prompt,
        temperature: 0.5,
        maxTokens: 800
      });

      // Parse AI response - remove markdown code blocks if present
      let jsonStr = typeof response === 'string' ? response : response.content || '';
      
      console.log('🤖 Raw AI response:', jsonStr.substring(0, 200));
      
      jsonStr = jsonStr.trim();
      
      if (!jsonStr) {
        throw new Error('AI returned empty response');
      }
      
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      console.log('📝 Cleaned JSON string:', jsonStr.substring(0, 200));
      
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.subject || !parsed.body) {
        throw new Error('AI response missing subject or body');
      }
      
      return {
        subject: parsed.subject,
        body: parsed.body
      };
    } catch (error) {
      console.error('Template generation failed:', error);
      if (error instanceof SyntaxError) {
        throw new Error('AI returned invalid JSON format');
      }
      throw new Error('Failed to generate email template');
    }
  }
}

export default new AIService();
