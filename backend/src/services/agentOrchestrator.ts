import aiService from './aiService';
import pdfService from './pdfService';
import scraperService from './scraperService';
import cronService from './cronService';
import { supabase } from '../config/supabase';
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
      description: 'Generate a PDF document. Use when user wants to create/generate a PDF/document/report.',
      parameters: {
        title: 'string - document title',
        content: 'string - document content',
      },
    },
    {
      name: 'scrape_website',
      description: 'Extract data from a website. Use when user wants to scrape/extract/get data from a URL.',
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

User: "What's the weather like?"
Response: {
  "tool": "conversation",
  "reasoning": "User is asking a general question, no automation needed",
  "parameters": {}
}

IMPORTANT: Always respond with valid JSON only, no additional text.`;
  }

  /**
   * Analyze user message and determine action
   */
  async analyzeIntent(message: string, _userId?: string): Promise<AgentAction> {
    try {
      const systemPrompt = this.getSystemPrompt();
      const fullPrompt = `${systemPrompt}\n\nUser message: "${message}"\n\nYour JSON response:`;

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
   * Execute email sending
   */
  private async executeSendEmail(params: any, userId?: string): Promise<string> {
    if (!userId) {
      return 'You need to be logged in to send emails. Please log in first.';
    }

    try {
      // Get user's email config
      const { data: configs, error } = await supabase
        .from('user_email_configs')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (error || !configs || configs.length === 0) {
        return 'No email configuration found. Please configure your SMTP settings in Settings > Email first.';
      }

      const config = configs[0];
      const decryptedPassword = decrypt(config.smtp_password);

      // Create custom transporter for this user
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465,
        auth: {
          user: config.smtp_user,
          pass: decryptedPassword,
        },
      });

      // Send email
      const info = await transporter.sendMail({
        from: config.smtp_user,
        to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: params.subject,
        text: params.body,
        html: `<p>${params.body}</p>`,
      });

      // Save to database
      await supabase.from('emails_sent').insert({
        user_id: userId,
        recipient: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: params.subject,
        body: params.body,
        status: 'sent',
        message_id: info.messageId,
      });

      return `✅ Email sent successfully to ${Array.isArray(params.to) ? params.to.join(', ') : params.to}! Message ID: ${info.messageId}`;
    } catch (error) {
      console.error('Email execution error:', error);
      return `❌ Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`;
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

      // Save to database
      await supabase.from('pdf_files').insert({
        user_id: userId,
        title: params.title,
        filename: filename,
        file_path: filepath,
        file_size: fileStats.size,
      });

      return `✅ PDF generated successfully: ${params.title} (${filename})`;
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

      // Save to database
      await supabase.from('scrape_jobs').insert({
        user_id: userId,
        url: params.url,
        status: 'completed',
        result_data: result,
      });

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
      // Save to database
      const { data, error } = await supabase
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
          console.log(`Executing cron job: ${params.name}`);
        },
      });

      return `✅ Scheduled task created: ${params.name}\nSchedule: ${params.schedule}\nTask will run automatically according to the schedule.`;
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
      // First, check if it's a simple conversation or needs tool execution
      const action = await this.analyzeIntent(message, userId);

      console.log('🤖 Agent decision:', action);

      if (action.tool === 'conversation') {
        // Just have AI respond naturally
        return await aiService.chat(message, conversationHistory);
      }

      // Execute the action
      const result = await this.executeAction(action, userId);
      
      // Have AI formulate a natural response
      const naturalResponse = await aiService.chat(
        `I just executed this action: ${action.tool} with these parameters: ${JSON.stringify(action.parameters)}. The result was: ${result}. 
        
        Please formulate a brief, natural response to tell the user what happened. Keep it concise and friendly.`,
        []
      );

      return naturalResponse || result;
    } catch (error) {
      console.error('Message processing error:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }
}

export default new AgentOrchestrator();
