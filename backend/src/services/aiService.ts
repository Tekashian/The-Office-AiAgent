import axios from 'axios';
import { AIRequest, AIResponse } from '../types';
import { supabaseAdmin } from '../config/supabase';

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
   * Get user context from database and format it for AI prompts
   */
  async getUserContext(userId: string): Promise<string> {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        console.log('⚠️ No user context found for:', userId);
        return '';
      }

      const contextParts: string[] = [];

      if (profile.full_name) {
        contextParts.push(`Użytkownik: ${profile.full_name}`);
      }

      if (profile.job_title) {
        contextParts.push(`Stanowisko: ${profile.job_title}`);
      }

      if (profile.department) {
        contextParts.push(`Dział: ${profile.department}`);
      }

      if (profile.company) {
        contextParts.push(`Firma: ${profile.company}`);
      }

      if (profile.company_description) {
        contextParts.push(`O firmie: ${profile.company_description}`);
      }

      if (profile.work_description) {
        contextParts.push(`Obowiązki zawodowe: ${profile.work_description}`);
      }

      if (profile.ai_context_notes) {
        contextParts.push(`Preferencje użytkownika: ${profile.ai_context_notes}`);
      }

      // Dodaj preferencje komunikacji
      if (profile.preferences) {
        const prefs = profile.preferences as any;
        
        if (prefs.communication_tone) {
          const toneMap: any = {
            'professional': 'profesjonalny i formalny',
            'friendly-professional': 'przyjazny ale profesjonalny',
            'casual': 'swobodny i nieformalny',
            'formal': 'bardzo formalny',
            'friendly': 'przyjazny i ciepły'
          };
          contextParts.push(`Preferowany ton: ${toneMap[prefs.communication_tone] || prefs.communication_tone}`);
        }

        if (prefs.language) {
          contextParts.push(`Język: ${prefs.language === 'pl' ? 'Polski' : prefs.language}`);
        }
      }

      if (contextParts.length === 0) {
        return '';
      }

      const contextString = `\n\n=== KONTEKST UŻYTKOWNIKA ===\n${contextParts.join('\n')}\n=== KONIEC KONTEKSTU ===\n\n`;
      console.log('✅ User context loaded:', contextParts.length, 'fields');
      return contextString;
    } catch (error) {
      console.error('❌ Error loading user context:', error);
      return '';
    }
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

      console.log('🔍 Full Gemini API response:', JSON.stringify(response.data, null, 2).substring(0, 1000));

      // Check for blocked content
      if (response.data.candidates?.[0]?.finishReason === 'SAFETY') {
        console.error('❌ Content blocked by Gemini safety filters');
        throw new Error('Content generation blocked by safety filters');
      }

      // Extract text from Gemini response structure
      const generatedText =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedText) {
        console.error('❌ No text in Gemini response');
        console.error('Candidates:', JSON.stringify(response.data.candidates));
        throw new Error('Gemini returned empty response');
      }

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
   * Generate email template based on category with user context
   */
  async generateEmailTemplate(
    category: string, 
    additionalContext?: string,
    userId?: string
  ): Promise<{ subject: string; body: string }> {
    try {
      // Load user context if userId provided
      let userContext = '';
      if (userId) {
        userContext = await this.getUserContext(userId);
      }

      const prompt = `${userContext}Generate a SHORT professional email template for the category: "${category}".
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- Create a subject line in Polish that fits the category
- Create a SHORT professional email body in Polish (max 3-4 sentences)
- Use placeholders like {{name}}, {{company}}, {{date}} where appropriate
- Keep it VERY concise and professional
${userContext ? '- Use the USER CONTEXT above to personalize the tone and style' : ''}

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

  /**
   * Generate PDF content based on category with user context
   */
  async generatePDFContent(
    category: string, 
    additionalContext?: string,
    userId?: string
  ): Promise<string> {
    try {
      // Load user context if userId provided
      let userContext = '';
      if (userId) {
        userContext = await this.getUserContext(userId);
      }

      const prompt = `${userContext}Generate professional PDF document content for the category: "${category}".
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- Create content in Polish
- Include appropriate sections for this document type
- Use placeholders like {{company_name}}, {{date}}, {{client_name}} where appropriate
- Make it professional and well-structured
- Keep it concise (max 500 words)
${userContext ? '- Use the USER CONTEXT above to personalize the content and tone' : ''}

Category-specific guidelines:
- Faktura VAT: Include header, company details, items table, total, payment info
- Oferta handlowa: Include introduction, offer details, pricing, validity, terms
- Umowa: Include parties, subject, terms, responsibilities, signatures
- Raport: Include title, executive summary, main content, conclusions

Return ONLY the document content in plain text format (NO JSON, NO markdown, just the text content).`;

      console.log('🔍 Sending PDF generation request to Gemini...');
      const response = await this.sendRequest({
        prompt,
        temperature: 0.6,
        maxTokens: 1500
      });

      console.log('📦 Raw Gemini response:', JSON.stringify(response).substring(0, 300));
      console.log('📦 Response type:', typeof response);
      console.log('📦 Response.content:', response.content?.substring(0, 200));
      
      // Gemini returns response.content, not the response itself as string
      let content = '';
      if (typeof response === 'string') {
        content = response;
      } else if (response && response.content) {
        content = response.content;
      } else {
        console.error('❌ Unexpected response structure:', response);
        throw new Error('AI returned invalid response structure');
      }
      
      if (!content || content.trim().length === 0) {
        console.error('❌ Content is empty after extraction');
        throw new Error('AI returned empty PDF content');
      }
      
      console.log('✅ PDF content extracted, length:', content.length);
      return content.trim();
    } catch (error) {
      console.error('❌ PDF content generation failed:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate PDF content: ${error.message}`);
      }
      throw new Error('Failed to generate PDF content');
    }
  }
}

export default new AIService();
