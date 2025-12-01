import aiService from './aiService';
import pdfService from './pdfService';
import scraperService from './scraperService';
import cronService from './cronService';
import { supabase, supabaseAdmin } from '../config/supabase';
import { decrypt } from '../utils/encryption';

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
      description: 'Schedule a recurring task. Use when user wants to automate/schedule something regularly (daily, weekly, etc).',
      parameters: {
        name: 'string - job name',
        schedule: 'string - cron expression (e.g., "0 8 * * *" for daily at 8am)',
        task_type: 'string - email, pdf, or scraper',
        task_config: 'object - configuration for the task',
      },
    },
    {
      name: 'conversation',
      description: 'Just have a conversation, answer questions, or provide information. Use when no action is needed.',
      parameters: {},
    },
  ];

  /**
   * Get system prompt with available tools
   */
  private getSystemPrompt(): string {
    const toolsDescription = this.tools
      .map(
        (tool) =>
          `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters, null, 2)}`
      )
      .join('\n\n');

    return `You are an AI office automation agent. You can help users with various tasks.

Available Tools:
${toolsDescription}

When a user asks you to do something, analyze their request and respond with a JSON object:
{
  "tool": "tool_name",
  "reasoning": "why you chose this tool",
  "parameters": { /* tool parameters */ }
}

If user request is ambiguous, use "conversation" tool and ask for clarification.

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
    "task_config": { "title": "Daily Report" }
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
IMPORTANT: When user provides a URL and wants data/information from it, ALWAYS use scrape_website tool, not conversation.`;
  }

  /**
   * Analyze user message and determine action
   */
  async analyzeIntent(message: string, userId?: string): Promise<AgentAction> {
    try {
      // Load user context if available
      let userContext = '';
      if (userId) {
        userContext = await aiService.getUserContext(userId);
      }

      const systemPrompt = this.getSystemPrompt();
      const fullPrompt = `${userContext}${systemPrompt}\n\nUser message: "${message}"\n\nYour JSON response:`;

      const response = await aiService.chat(fullPrompt, []);
      
      // Parse AI response
      const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const action = JSON.parse(cleanResponse) as AgentAction;
      
      return action;
    } catch (error) {
      console.error('Intent analysis failed:', error);
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
      console.log('📧 Attempting to send email using IMAP config...');
      console.log('🔑 User ID:', userId);
      
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
        
        console.log('🔍 All IMAP configs in database:', allConfigs);
        
        return 'It looks like your email couldn\'t be sent because there\'s no email configuration set up yet. Please configure your IMAP settings in AI Email Inbox to send emails.';
      }

      const imap = imapConfigs[0];
      const decryptedPassword = decrypt(imap.imap_password);

      console.log('📤 Sending email via Gmail SMTP using IMAP credentials...');
      
      // Get user profile for email signature and context
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('email_signature, full_name, job_title, company')
        .eq('user_id', userId)
        .single();

      console.log('👤 User profile loaded:', profile ? 'Yes' : 'No');

      // Generate professional email with AI using user context
      let emailBody = params.body;
      let emailSubject = params.subject;

      // If body is simple (no formatting), enhance it with AI
      if (!params.body.includes('\n\n') && !params.body.includes('Szanowni') && !params.body.includes('Z poważaniem')) {
        console.log('🤖 Enhancing email with AI for professional format...');
        
        try {
          const enhanced = await aiService.generateEmailTemplate(
            'professional_notification',
            `Create a professional formal email with this message: "${params.body}". Subject should be: "${params.subject || 'Ważna informacja'}".`,
            userId
          );
          
          emailBody = enhanced.body;
          emailSubject = enhanced.subject || params.subject;
          
          console.log('✅ Email enhanced with professional format');
        } catch (enhanceError) {
          console.warn('⚠️ Could not enhance email, using original:', enhanceError);
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
        
        // Add signature if email doesn't already have a closing
        if (!emailBody.includes('Z poważaniem') && !emailBody.includes('Pozdrawiam')) {
          emailBody = `${emailBody}\n\n${signature}`;
        }
      }

      // Convert \n to proper line breaks for HTML
      const htmlBody = emailBody.replace(/\n/g, '<br>');
      
      // Use Gmail SMTP with IMAP credentials
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: imap.imap_user,
          pass: decryptedPassword,
        },
      });

      // Send email
      const info = await transporter.sendMail({
        from: imap.imap_user,
        to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: emailSubject,
        text: emailBody,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${htmlBody}</div>`,
      });

      console.log('✅ Email sent successfully:', info.messageId);

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
      console.error('Email execution error:', error);
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
      const fs = require('fs');
      const path = require('path');
      
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
      });

      if (error) {
        console.error('❌ Failed to save PDF to database:', error);
      } else {
        console.log('✅ PDF saved to database:', data);
      }

      return `✅ PDF generated successfully: ${params.title} (${filename})\n\nTwój raport PDF jest dostępny w zakładce PDF Generator w sekcji Ostatnie PDF.`;
    } catch (error) {
      console.error('PDF execution error:', error);
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
      });

      if (error) {
        console.error('❌ Failed to save scrape job to database:', error);
      } else {
        console.log('✅ Scrape job saved to database:', data);
      }

      const resultPreview = JSON.stringify(result, null, 2).substring(0, 500);
      return `✅ Website scraped successfully!\n\nURL: ${params.url}\n\nData preview:\n${resultPreview}${JSON.stringify(result).length > 500 ? '...' : ''}`;
    } catch (error) {
      console.error('Scraping execution error:', error);
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
          console.log(`🕐 Executing cron job: ${params.name} (${params.task_type})`);

          try {
            let result = '';

            // Execute appropriate action based on task type
            switch (params.task_type) {
              case 'email':
                console.log('📧 Sending scheduled email...');
                result = await this.executeSendEmail(params.task_config, userId);
                break;

              case 'pdf':
                console.log('📄 Generating scheduled PDF...');
                result = await this.executeGeneratePDF(params.task_config, userId);
                break;

              case 'scraper':
                console.log('🕷️ Running scheduled scraper...');
                result = await this.executeScrapeWebsite(params.task_config, userId);
                break;

              default:
                console.error(`❌ Unknown task type: ${params.task_type}`);
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

            console.log(`✅ Cron job completed: ${params.name}`);
            console.log(`Result: ${result.substring(0, 100)}...`);
          } catch (error) {
            console.error(`❌ Cron job failed: ${params.name}`, error);

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
      console.error('Cron job execution error:', error);
      return `❌ Failed to create scheduled task: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute conversation (just respond)
   */
  private async executeConversation(_params: any, _userId?: string): Promise<string> {
    return 'I\'m here to help! You can ask me to:\n\n' +
           '✉️ Send emails\n' +
           '📄 Generate PDF documents\n' +
           '🕷️ Scrape websites for data\n' +
           '⏰ Schedule recurring tasks\n\n' +
           'What would you like to do?';
  }

  /**
   * Process user message end-to-end
   */
  async processMessage(message: string, userId?: string, conversationHistory?: any[]): Promise<string> {
    try {
      console.log('🔍 Processing message:', { message, userId });
      
      // First, check if it's a simple conversation or needs tool execution
      const action = await this.analyzeIntent(message, userId);

      console.log('🤖 Agent decision:', action);

      if (action.tool === 'conversation') {
        console.log('💬 Tool is conversation, using AI chat...');
        // Load user context for natural conversation
        let userContext = '';
        if (userId) {
          userContext = await aiService.getUserContext(userId);
        }
        
        // Just have AI respond naturally with context
        const contextualMessage = userContext ? `${userContext}\n\n${message}` : message;
        return await aiService.chat(contextualMessage, conversationHistory);
      }

      console.log('🔧 Executing action:', action.tool);
      // Execute the action
      const result = await this.executeAction(action, userId);
      
      console.log('✅ Action result:', result);
      
      // Load user context for natural response
      let userContext = '';
      if (userId) {
        userContext = await aiService.getUserContext(userId);
      }
      
      // Have AI formulate a natural response with user context
      const contextualPrompt = `${userContext}I just executed this action: ${action.tool} with these parameters: ${JSON.stringify(action.parameters)}. The result was: ${result}. 
        
        Please formulate a brief, natural response to tell the user what happened. Keep it concise and friendly.`;
      
      const naturalResponse = await aiService.chat(contextualPrompt, []);

      return naturalResponse || result;
    } catch (error) {
      console.error('Message processing error:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }
}

export default new AgentOrchestrator();
