import aiService from './aiService';
import pdfService from './pdfService';
import scraperService from './scraperService';
import cronService from './cronService';
import { supabase, supabaseAdmin } from '../config/supabase';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import userContextService from './userContextService';

/**
 * AI Agent Orchestrator
 * Interprets user intent and executes appropriate actions
 */

interface Tool {
  name: string;
  description: string;
  parameters: any;
}

interface AgentAction {
  tool: string;
  reasoning: string;
  parameters: any;
}

class AgentOrchestrator {
  private tools: Tool[] = [
    {
      name: 'send_email',
      description: 'Send an email to one or more recipients. Use when user wants to send/compose/email someone.',
      parameters: {
        to: 'string[] - recipient email addresses',
        subject: 'string - email subject',
        body: 'string - email body/content',
      },
    },
    {
      name: 'generate_pdf',
      description: 'Generate a PDF document. Use when user wants to create/generate/make a PDF/document/report/raport. Keywords: pdf, raport, dokument, wygeneruj, stwórz, utwórz.',
      parameters: {
        title: 'string - document title',
        content: 'string - document content',
      },
    },
    {
      name: 'scrape_website',
      description: 'Extract data from a website. Use when user wants to scrape/extract/get/fetch/download/pobierz/zeskrapuj data from a URL or website. Keywords: scrape, pobierz, extract, dane ze strony, fetch, website data.',
      parameters: {
        url: 'string - website URL to scrape',
        selectors: 'object - CSS selectors for data extraction (optional)',
      },
    },
    {
      name: 'create_cron_job',
      description: 'Create a scheduled/recurring task that runs automatically at specified times. Use when user wants to automate/schedule/zaplanuj/utwórz zadanie cykliczne/recurring task. Keywords: schedule, automate, recurring, cykliczne, cron, zadanie, automatyczne, regularne, powtarzające się, o określonej porze.',
      parameters: {
        name: 'string - descriptive job name',
        schedule: 'string - cron expression (e.g., "0 9 * * *" = daily at 9am, "0 9 * * 1" = every Monday at 9am, "0 */2 * * *" = every 2 hours)',
        task_type: 'string - type of task: "email", "pdf", or "scraper"',
        task_config: 'object - task configuration (same as the task tool parameters)',
      },
    },
    {
      name: 'conversation',
      description: 'Just have a conversation, answer questions, or provide information. Use when no action is needed.',
      parameters: {},
    },
  ];

  /**
   * Detect language from user message
   */
  private detectLanguage(message: string): string {
    // Simple language detection based on common Polish characters and words
    const polishIndicators = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|(?:jest|czy|się|ale|dla|lub|jak|mam|może|chcę|proszę|dziękuję|witaj|cześć|dobry|zadanie|cykliczne|automatycznie|wysłać|wygeneruj|utwórz|stwórz|pobierz)/i;
    return polishIndicators.test(message) ? 'Polish' : 'English';
  }

  /**
   * Get system prompt with available tools
   */
  private getSystemPrompt(userLanguage: string = 'English'): string {
    const toolsDescription = this.tools
      .map(
        (tool) =>
          `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters, null, 2)}`
      )
      .join('\n\n');

    const languageInstruction = userLanguage === 'Polish' 
      ? '🌍 WAŻNE: Użytkownik pisze PO POLSKU. Odpowiadaj WYŁĄCZNIE PO POLSKU we wszystkich komunikatach.'
      : '🌍 IMPORTANT: User writes in ENGLISH. Respond in ENGLISH in all communications.';

    return `You are an AI office automation agent. You can help users with various tasks.

${languageInstruction}

Available Tools:
${toolsDescription}

⚠️ CRITICAL: You MUST respond ONLY with a valid JSON object. Never respond with explanatory text or markdown.

When a user asks you to do something, analyze their request and respond with a JSON object:
{
  "tool": "tool_name",
  "reasoning": "why you chose this tool",
  "parameters": { /* tool parameters */ }
}

🔑 Key tool selection rules:
- Use "create_cron_job" for: scheduled tasks, recurring tasks, automation, cykliczne zadania, automatyczne zadania, o określonej porze, regularnie, co X czasu
  * If frequency NOT specified, use DEFAULT: "0 9 * * *" (daily at 9am)
  * NEVER ask user for frequency - always provide a sensible default
- Use "send_email" for: one-time email sending (without scheduling)
- Use "generate_pdf" for: one-time PDF creation (without scheduling)
- Use "scrape_website" for: one-time website scraping (without scheduling)
- Use "conversation" ONLY if you cannot determine which tool to use at all

⚠️ IMPORTANT: For recurring tasks (cykliczne zadania), ALWAYS use "create_cron_job" even if frequency is not specified. Use default schedule "0 9 * * *" (daily at 9am).

Examples:

User: "Send an email to john@example.com saying the report is ready"
Response: {
  "tool": "send_email",
  "reasoning": "User wants to send an email",
  "parameters": {
    "to": ["john@example.com"],
    "subject": "Report Status",
    "body": "The report is ready."
  }
}

User: "Create a daily report at 9am"
Response: {
  "tool": "create_cron_job",
  "reasoning": "User wants to schedule a recurring task",
  "parameters": {
    "name": "Daily Report",
    "schedule": "0 9 * * *",
    "task_type": "pdf",
    "task_config": { "title": "Daily Report", "content": "Daily summary report" }
  }
}

User: "Utwórz zadanie cykliczne co poniedziałek o 9:00"
Response: {
  "tool": "create_cron_job",
  "reasoning": "User wants to create a recurring task every Monday",
  "parameters": {
    "name": "Zadanie poniedziałkowe",
    "schedule": "0 9 * * 1",
    "task_type": "email",
    "task_config": { 
      "to": ["user@example.com"], 
      "subject": "Cotygodniowe przypomnienie",
      "body": "To jest automatyczna wiadomość wysyłana co poniedziałek."
    }
  }
}

User: "Automatycznie wysyłaj raport każdego dnia o 8 rano"
Response: {
  "tool": "create_cron_job",
  "reasoning": "User wants to automate daily report sending",
  "parameters": {
    "name": "Dzienny raport automatyczny",
    "schedule": "0 8 * * *",
    "task_type": "email",
    "task_config": {
      "to": ["manager@example.com"],
      "subject": "Dzienny raport",
      "body": "Raport dzienny wygenerowany automatycznie."
    }
  }
}

User: "Wygeneruj raport sprzedażowy"
Response: {
  "tool": "generate_pdf",
  "reasoning": "User wants to generate a PDF report",
  "parameters": {
    "title": "Raport sprzedażowy",
    "content": "Raport sprzedażowy zawierający podsumowanie wyników sprzedaży."
  }
}

User: "Utwórz zadanie cykliczne polegające na pobieraniu danych strony https://example.com"
Response: {
  "tool": "create_cron_job",
  "reasoning": "User wants to create a recurring scraping task. No frequency specified, using default: daily at 9am",
  "parameters": {
    "name": "Scraping zadanie - example.com",
    "schedule": "0 9 * * *",
    "task_type": "scraper",
    "task_config": {
      "url": "https://example.com"
    }
  }
}

User: "Utwórz zadanie cykliczne wysyłające email"
Response: {
  "tool": "create_cron_job",
  "reasoning": "User wants recurring email. No frequency specified, using default: daily at 9am",
  "parameters": {
    "name": "Cykliczne wysyłanie emaila",
    "schedule": "0 9 * * *",
    "task_type": "email",
    "task_config": {
      "to": ["user@example.com"],
      "subject": "Codzienne przypomnienie",
      "body": "To jest automatyczna wiadomość."
    }
  }
}

User: "Stwórz dokument PDF o tytule Test"
Response: {
  "tool": "generate_pdf",
  "reasoning": "User wants to create a PDF document",
  "parameters": {
    "title": "Test",
    "content": "Dokument testowy."
  }
}

User: "Pobierz dane ze strony https://example.com"
Response: {
  "tool": "scrape_website",
  "reasoning": "User wants to scrape data from a website",
  "parameters": {
    "url": "https://example.com"
  }
}

User: "What's the weather like?"
Response: {
  "tool": "conversation",
  "reasoning": "User is asking a general question, no automation needed",
  "parameters": {}
}

IMPORTANT: Always respond with valid JSON only, no additional text.
IMPORTANT: When user provides a URL and wants data/information from it, ALWAYS use scrape_website tool, not conversation.
IMPORTANT: When user wants to schedule/automate/create recurring tasks (keywords: cykliczne, schedule, automat, regularne, co dzień, co tydzień), ALWAYS use create_cron_job tool.
IMPORTANT: Cron expressions format: "minute hour day month weekday" (e.g., "0 9 * * *" = 9am daily, "0 9 * * 1" = 9am Mondays).`;
  }

  /**
   * Analyze user message and determine action
   */
  async analyzeIntent(message: string, userId?: string): Promise<AgentAction> {
    try {
      // Detect user language
      const userLanguage = this.detectLanguage(message);
      
      // Load user context if available
      let userContext = '';
      if (userId) {
        userContext = await aiService.getUserContext(userId);
      }

      const systemPrompt = this.getSystemPrompt(userLanguage);
      const fullPrompt = `${userContext}${systemPrompt}\n\nUser message: "${message}"\n\nYour JSON response:`;

      const response = await aiService.chat(fullPrompt, []);
      
      logger.debug('AI raw response for intent analysis', { 
        response: response.substring(0, 500),
        messagePreview: message.substring(0, 100),
        detectedLanguage: userLanguage
      });
      
      // Parse AI response
      const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const action = JSON.parse(cleanResponse) as AgentAction;
      
      logger.info('Intent analyzed successfully', { 
        tool: action.tool, 
        reasoning: action.reasoning.substring(0, 100),
        language: userLanguage
      });
      
      return action;
    } catch (error) {
      logger.error('Intent analysis failed - AI did not return valid JSON', error, {
        message: message.substring(0, 200)
      });
      // Fallback to conversation
      return {
        tool: 'conversation',
        reasoning: 'Could not parse intent, treating as conversation',
        parameters: {},
      };
    }
  }

  /**
   * Execute the determined action
   */
  async executeAction(action: AgentAction, userId?: string): Promise<string> {
    try {
      switch (action.tool) {
        case 'send_email':
          return await this.executeSendEmail(action.parameters, userId);

        case 'generate_pdf':
          return await this.executeGeneratePDF(action.parameters, userId);

        case 'scrape_website':
          return await this.executeScrapeWebsite(action.parameters, userId);

        case 'create_cron_job':
          return await this.executeCreateCronJob(action.parameters, userId);

        case 'conversation':
          return await this.executeConversation(action.parameters);

        default:
          return `Unknown tool: ${action.tool}`;
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      return `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute email sending - uses IMAP configuration
   */
  private async executeSendEmail(params: any, userId?: string): Promise<string> {
    if (!userId) {
      return 'You need to be logged in to send emails. Please log in first.';
    }

    try {
      logger.info('Attempting to send email using IMAP config', { userId });
      
      // Get user's IMAP config (Gmail uses same credentials for SMTP)
      // Use supabaseAdmin to bypass RLS (same as emailInboxService)
      const { data: imapConfigs, error } = await supabaseAdmin
        .from('user_imap_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      console.log('📊 Query result:', { 
        error: error?.message, 
        configsCount: imapConfigs?.length || 0,
        configs: imapConfigs 
      });

      if (error || !imapConfigs || imapConfigs.length === 0) {
        console.log('❌ No IMAP configuration found for user:', userId);
        
        // Debug: Check if there are ANY configs in the table
        const { data: allConfigs } = await supabaseAdmin
          .from('user_imap_configs')
          .select('user_id, imap_user, is_active')
          .limit(5);
        
        logger.debug('All IMAP configs in database', { count: allConfigs?.length || 0 });
        
        return 'It looks like your email couldn\'t be sent because there\'s no email configuration set up yet. Please configure your IMAP settings in AI Email Inbox to send emails.';
      }

      const imap = imapConfigs[0];
      const decryptedPassword = decrypt(imap.imap_password);

      logger.info('Sending email via Gmail SMTP using IMAP credentials');
      
      // Get user profile for email signature and context
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('email_signature, full_name, job_title, company')
        .eq('user_id', userId)
        .single();

      logger.debug('User profile loaded', { hasProfile: !!profile });

      // Generate professional email with AI using user context
      let emailBody = params.body;
      let emailSubject = params.subject;

      // If body is simple (no formatting), enhance it with AI
      if (!params.body.includes('\n\n') && !params.body.includes('Szanowni') && !params.body.includes('Z poważaniem')) {
        logger.info('Enhancing email with AI for professional format');
        
        try {
          const enhanced = await aiService.generateProfessionalEmail({
            subject: params.subject || 'Ważna informacja',
            message: params.body,
            tone: 'professional',
            senderName: profile?.full_name,
            senderPosition: profile?.job_title,
            company: profile?.company,
          });
          
          emailBody = enhanced;
          emailSubject = params.subject || 'Ważna informacja';
          
          logger.info('Email enhanced with professional format');
        } catch (enhanceError) {
          logger.warn('Could not enhance email, using original', { error: enhanceError instanceof Error ? enhanceError.message : String(enhanceError) });
        }
      }

      // Add email signature if available and not already present
      if (profile?.email_signature && !emailBody.includes(profile.email_signature)) {
        // Replace placeholders in signature
        let signature = profile.email_signature;
        signature = signature.replace(/\{\{name\}\}/g, profile.full_name || '');
        signature = signature.replace(/\{\{position\}\}/g, profile.job_title || '');
        signature = signature.replace(/\{\{company\}\}/g, profile.company || '');
        signature = signature.replace(/\{\{sender_name\}\}/g, profile.full_name || '');
        signature = signature.replace(/\{\{sender_position\}\}/g, profile.job_title || '');
        signature = signature.replace(/\{\{company_name\}\}/g, profile.company || '');
        
        // Always add signature with proper spacing
        // Remove "Z poważaniem" from AI-generated email if it exists (will be in signature)
        emailBody = emailBody.replace(/\n*Z poważaniem[,]?\s*/gi, '');
        emailBody = emailBody.replace(/\n*Pozdrawiam[,]?\s*/gi, '');
        
        emailBody = `${emailBody.trim()}\n\n${signature}`;
      }

      // Convert \n to proper line breaks for HTML
      const htmlBody = emailBody.replace(/\n/g, '<br>');
      
      // Use Gmail SMTP with IMAP credentials
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: imap.imap_user,
          pass: decryptedPassword,
        },
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 20000,   // 20 seconds
        socketTimeout: 40000,      // 40 seconds
      });

      logger.info('SMTP transporter created, attempting to send email...');

      // Send email
      const info = await transporter.sendMail({
        from: imap.imap_user,
        to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: emailSubject,
        text: emailBody,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${htmlBody}</div>`,
      });

      logger.info('Email sent successfully', { messageId: info.messageId });

      // Save to database (use supabaseAdmin to bypass RLS)
      await supabaseAdmin.from('emails_sent').insert({
        user_id: userId,
        recipient: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: emailSubject,
        body: emailBody,
        status: 'sent',
        message_id: info.messageId,
      });

      return `✅ Email sent successfully to ${Array.isArray(params.to) ? params.to.join(', ') : params.to}!`;
    } catch (error) {
      logger.error('Email execution error', { 
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      });
      return `❌ Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure you\'ve configured your email in AI Email Inbox.`;
    }
  }

  /**
   * Execute PDF generation
   */
  private async executeGeneratePDF(params: any, userId?: string): Promise<string> {
    if (!userId) {
      return 'You need to be logged in to generate PDFs.';
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${Date.now()}_${params.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      await pdfService.generatePDF(params.content, filepath, {
        title: params.title,
      });

      const fileStats = fs.statSync(filepath);

      // Save to database (use supabaseAdmin to bypass RLS)
      const { data, error } = await supabaseAdmin.from('pdf_files').insert({
        user_id: userId,
        title: params.title,
        filename: filename,
        file_path: filepath,
        file_size: fileStats.size,
      }).select().single();

      if (error) {
        logger.error('Failed to save PDF to database', error);
      } else {
        logger.info('PDF saved to database', { pdfId: data?.id });
      }

      return `✅ PDF generated successfully: ${params.title} (${filename})\n\nTwój raport PDF jest dostępny w zakładce PDF Generator w sekcji Ostatnie PDF.`;
    } catch (error) {
      logger.error('PDF execution error', error);
      return `❌ Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute website scraping
   */
  private async executeScrapeWebsite(params: any, userId?: string): Promise<string> {
    if (!userId) {
      return 'You need to be logged in to scrape websites.';
    }

    try {
      const result = await scraperService.scrapeWebPage({
        url: params.url,
        selectors: params.selectors,
      });

      // Generate name from URL
      const urlObj = new URL(params.url);
      const scrapeName = `Scrape ${urlObj.hostname} - ${new Date().toLocaleString('pl-PL')}`;

      // Save to database (use supabaseAdmin to bypass RLS)
      const { data, error } = await supabaseAdmin.from('scrape_jobs').insert({
        user_id: userId,
        name: scrapeName,
        url: params.url,
        status: 'completed',
        result_data: result,
      }).select().single();

      if (error) {
        logger.error('Failed to save scrape job to database', error);
      } else {
        logger.info('Scrape job saved to database', { jobId: data?.id });
      }

      const resultPreview = JSON.stringify(result, null, 2).substring(0, 500);
      return `✅ Website scraped successfully!\n\nURL: ${params.url}\n\nData preview:\n${resultPreview}${JSON.stringify(result).length > 500 ? '...' : ''}`;
    } catch (error) {
      logger.error('Scraping execution error', error);
      return `❌ Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute cron job creation
   */
  private async executeCreateCronJob(params: any, userId?: string): Promise<string> {
    if (!userId) {
      return 'You need to be logged in to create scheduled tasks.';
    }

    try {
      // Save to database (use supabaseAdmin to bypass RLS)
      const { data, error } = await supabaseAdmin
        .from('cron_jobs')
        .insert({
          user_id: userId,
          name: params.name,
          schedule: params.schedule,
          task_type: params.task_type,
          task_config: params.task_config,
          enabled: true,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule the job
      cronService.scheduleJob({
        name: `${userId}_${data.id}`,
        schedule: params.schedule,
        enabled: true,
        task: async () => {
          // Execute based on task type
          logger.info('Executing cron job', { name: params.name, taskType: params.task_type });

          try {
            let result = '';

            // Execute appropriate action based on task type
            switch (params.task_type) {
              case 'email':
                logger.info('Sending scheduled email');
                result = await this.executeSendEmail(params.task_config, userId);
                break;

              case 'pdf':
                logger.info('Generating scheduled PDF');
                result = await this.executeGeneratePDF(params.task_config, userId);
                break;

              case 'scraper':
                logger.info('Running scheduled scraper');
                result = await this.executeScrapeWebsite(params.task_config, userId);
                break;

              default:
                logger.error('Unknown task type', null, { taskType: params.task_type });
                result = `Unknown task type: ${params.task_type}`;
            }

            // Update status in database (use supabaseAdmin to bypass RLS)
            await supabaseAdmin
              .from('cron_jobs')
              .update({
                status: 'completed',
                last_run: new Date().toISOString(),
                last_result: result,
              })
              .eq('id', data.id);

            logger.info('Cron job completed', { name: params.name, resultPreview: result.substring(0, 100) });
          } catch (error) {
            logger.error('Cron job failed', error, { name: params.name });

            // Save error to database (use supabaseAdmin to bypass RLS)
            await supabaseAdmin
              .from('cron_jobs')
              .update({
                status: 'failed',
                last_run: new Date().toISOString(),
                last_error: error instanceof Error ? error.message : 'Unknown error',
              })
              .eq('id', data.id);
          }
        },
      });

      return `✅ Scheduled task created: ${params.name}\nSchedule: ${params.schedule}\nType: ${params.task_type}\nTask will run automatically according to the schedule.`;
    } catch (error) {
      logger.error('Cron job execution error', error);
      return `❌ Failed to create scheduled task: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute conversation (just respond) - deprecated, not used anymore
   */
  private async executeConversation(_params: any, _userId?: string): Promise<string> {
    // This method is deprecated - conversation responses are handled in processMessage
    return '';
  }

  /**
   * Process user message end-to-end
   */
  async processMessage(message: string, userId?: string, conversationHistory?: any[]): Promise<string> {
    try {
      // Detect user language
      const userLanguage = this.detectLanguage(message);
      
      logger.info('Processing message', { 
        message: message.substring(0, 100), 
        userId,
        detectedLanguage: userLanguage 
      });
      
      // First, check if it's a simple conversation or needs tool execution
      const action = await this.analyzeIntent(message, userId);

      logger.debug('Agent decision', { tool: action.tool, reasoning: action.reasoning.substring(0, 100) });

      if (action.tool === 'conversation') {
        logger.debug('Tool is conversation, using AI chat');
        // Load user context for natural conversation
        let userContext = '';
        if (userId) {
          userContext = await aiService.getUserContext(userId);
        }
        
        // Add language instruction to ensure response matches user's language
        const languageInstruction = userLanguage === 'Polish' 
          ? 'Odpowiadaj WYŁĄCZNIE PO POLSKU.\n\n'
          : 'Respond in ENGLISH.\n\n';
        
        // Just have AI respond naturally with context
        const contextualMessage = `${languageInstruction}${userContext ? userContext + '\n\n' : ''}${message}`;
        return await aiService.chat(contextualMessage, conversationHistory || []);
      }

      logger.info('Executing action', { tool: action.tool });
      // Execute the action
      const result = await this.executeAction(action, userId);
      
      logger.debug('Action result', { resultPreview: result.substring(0, 200) });
      
      // Load user context for natural response
      let userContext = '';
      if (userId) {
        userContext = await aiService.getUserContext(userId);
      }
      
      // Have AI formulate a natural response with user context in the detected language
      const languageInstruction = userLanguage === 'Polish'
        ? 'Odpowiedz PO POLSKU.'
        : 'Respond in ENGLISH.';
      
      const contextualPrompt = `${languageInstruction} ${userContext}I just executed this action: ${action.tool} with these parameters: ${JSON.stringify(action.parameters)}. The result was: ${result}. 
        
        Please formulate a brief, natural response to tell the user what happened. Keep it concise and friendly.`;
      
      const naturalResponse = await aiService.chat(contextualPrompt, []);

      return naturalResponse || result;
    } catch (error) {
      logger.error('Message processing error', error);
      const userLanguage = this.detectLanguage(message);
      return userLanguage === 'Polish' 
        ? 'Przepraszam, napotkałem błąd podczas przetwarzania Twojego żądania. Spróbuj ponownie.'
        : 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }
}

export default new AgentOrchestrator();
