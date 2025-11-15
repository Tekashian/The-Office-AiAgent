// @ts-ignore - No TypeScript types available
import Imap from 'imap';
// @ts-ignore - No TypeScript types available
import { simpleParser } from 'mailparser';
import { supabase, supabaseAdmin } from '../config/supabase';
import { decrypt } from '../utils/encryption';
import aiService from './aiService';

interface ImapConfig {
  id: string;
  user_id: string;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_password: string;
  use_ssl: boolean;
}

interface ParsedEmail {
  messageId: string;
  from: { address: string; name?: string };
  to: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  hasAttachments: boolean;
  attachmentsCount: number;
}

class EmailInboxService {
  /**
   * Scan user's inbox for new emails
   */
  async scanInbox(userId: string): Promise<{ success: boolean; emailsFound: number }> {
    try {
      // Get user's IMAP config (using admin client to bypass RLS)
      const { data: configs, error } = await supabaseAdmin
        .from('user_imap_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (error || !configs || configs.length === 0) {
        throw new Error('No active IMAP configuration found');
      }

      const config = configs[0] as ImapConfig;
      console.log('🔍 IMAP Config found:', {
        id: config.id,
        user: config.imap_user,
        host: config.imap_host,
        port: config.imap_port,
        ssl: config.use_ssl,
        encrypted_password_length: config.imap_password.length,
      });
      
      const decryptedPassword = decrypt(config.imap_password);
      console.log('🔓 Password decrypted, length:', decryptedPassword.length);

      // Create scan log (using admin client)
      const { data: scanLog } = await supabaseAdmin
        .from('email_scan_logs')
        .insert({
          user_id: userId,
          imap_config_id: config.id,
          scan_started_at: new Date().toISOString(),
          status: 'running',
        })
        .select()
        .single();

      // Connect to IMAP
      const emails = await this.fetchUnreadEmails(config, decryptedPassword);

      // Process each email
      let processedCount = 0;
      for (const email of emails) {
        await this.processEmail(userId, email);
        processedCount++;
      }

      // Update scan log
      await supabaseAdmin
        .from('email_scan_logs')
        .update({
          scan_completed_at: new Date().toISOString(),
          emails_found: emails.length,
          emails_new: emails.length,
          emails_processed: processedCount,
          status: 'completed',
        })
        .eq('id', scanLog.id);

      // Update last_scan_at
      await supabaseAdmin
        .from('user_imap_configs')
        .update({ last_scan_at: new Date().toISOString() })
        .eq('id', config.id);

      return { success: true, emailsFound: emails.length };
    } catch (error) {
      console.error('Inbox scan error:', error);
      throw error;
    }
  }

  /**
   * Fetch unread emails from IMAP
   */
  private async fetchUnreadEmails(
    config: ImapConfig,
    password: string
  ): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.imap_user,
        password: password,
        host: config.imap_host,
        port: config.imap_port,
        tls: config.use_ssl,
        tlsOptions: { rejectUnauthorized: false },
      });

      const emails: ParsedEmail[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }

          // Search for last 10 emails (newest first)
          imap.search(['ALL'], (searchErr: Error | null, results: number[]) => {
            if (searchErr) {
              reject(searchErr);
              return;
            }

            if (results.length === 0) {
              imap.end();
              resolve([]);
              return;
            }

            // Get only last 10 emails (newest)
            const lastTen = results.slice(-10);
            console.log(`📬 Found ${results.length} total emails, fetching last 10`);

            const fetch = imap.fetch(lastTen, { bodies: '' });

            fetch.on('message', (msg: any) => {
              msg.on('body', (stream: any) => {
                simpleParser(stream, async (parseErr: Error | null, parsed: any) => {
                  if (parseErr) {
                    console.error('Parse error:', parseErr);
                    return;
                  }

                  emails.push({
                    messageId: parsed.messageId || `${Date.now()}@local`,
                    from: {
                      address: parsed.from?.value?.[0]?.address || '',
                      name: parsed.from?.value?.[0]?.name,
                    },
                    to: parsed.to?.value?.[0]?.address || '',
                    subject: parsed.subject || 'No Subject',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date(),
                    hasAttachments: (parsed.attachments?.length || 0) > 0,
                    attachmentsCount: parsed.attachments?.length || 0,
                  });
                });
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve(emails);
            });

            fetch.once('error', (fetchErr: Error) => {
              reject(fetchErr);
            });
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Process a single email: save to DB and generate AI response
   */
  private async processEmail(userId: string, email: ParsedEmail): Promise<void> {
    try {
      // Check if email already exists
      const { data: existing } = await supabaseAdmin
        .from('emails_inbox')
        .select('id')
        .eq('message_id', email.messageId)
        .single();

      if (existing) {
        console.log('Email already exists:', email.messageId);
        return;
      }

      // Analyze email with AI
      const analysis = await this.analyzeEmailWithAI(email);

      // Save to inbox
      const { data: inboxEmail, error } = await supabaseAdmin
        .from('emails_inbox')
        .insert({
          user_id: userId,
          message_id: email.messageId,
          from_address: email.from.address,
          from_name: email.from.name,
          to_address: email.to,
          subject: email.subject,
          body_text: email.text,
          body_html: email.html,
          received_at: email.date.toISOString(),
          has_attachments: email.hasAttachments,
          attachments_count: email.attachmentsCount,
          ai_analyzed: true,
          ai_priority: analysis.priority,
          ai_category: analysis.category,
          ai_sentiment: analysis.sentiment,
          ai_summary: analysis.summary,
          ai_suggested_action: analysis.suggestedAction,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save email to inbox:', error);
        return;
      }

      // Generate AI draft response if needed
      if (analysis.suggestedAction === 'reply') {
        await this.generateAIDraft(userId, inboxEmail.id, email);
      }
    } catch (error) {
      console.error('Process email error:', error);
    }
  }

  /**
   * Analyze email with AI
   */
  private async analyzeEmailWithAI(email: ParsedEmail): Promise<{
    priority: string;
    category: string;
    sentiment: string;
    summary: string;
    suggestedAction: string;
  }> {
    try {
      const prompt = `Analyze this email and provide a JSON response:

From: ${email.from.address} ${email.from.name ? `(${email.from.name})` : ''}
Subject: ${email.subject}
Body: ${email.text.substring(0, 1000)}

Provide analysis in this exact JSON format:
{
  "priority": "urgent|high|normal|low",
  "category": "question|request|complaint|info|spam|other",
  "sentiment": "positive|neutral|negative",
  "summary": "Brief 1-2 sentence summary",
  "suggestedAction": "reply|forward|archive|delete"
}

Respond ONLY with valid JSON, no additional text.`;

      const response = await aiService.chat(prompt, []);
      const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      if (!cleanResponse || cleanResponse.length < 10) {
        console.error('AI returned empty or too short response:', cleanResponse);
        throw new Error('Empty AI response');
      }
      
      const analysis = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!analysis.priority || !analysis.category || !analysis.sentiment) {
        console.error('AI returned incomplete analysis:', analysis);
        throw new Error('Incomplete AI analysis');
      }

      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback
      return {
        priority: 'normal',
        category: 'other',
        sentiment: 'neutral',
        summary: email.subject,
        suggestedAction: 'reply',
      };
    }
  }

  /**
   * Generate AI draft response
   */
  private async generateAIDraft(
    userId: string,
    inboxEmailId: string,
    email: ParsedEmail
  ): Promise<void> {
    try {
      const prompt = `Generate a professional email response:

Original Email:
From: ${email.from.address} ${email.from.name ? `(${email.from.name})` : ''}
Subject: ${email.subject}
Body: ${email.text.substring(0, 1500)}

Generate a response in this JSON format:
{
  "subject": "Re: ${email.subject}",
  "body": "Professional response body",
  "tone": "professional|friendly|formal",
  "reasoning": "Why this response is appropriate",
  "confidence": 0.85
}

Make the response:
- Professional and courteous
- Address the sender's concerns
- Keep it concise (2-3 paragraphs max)
- Sign off appropriately

Respond ONLY with valid JSON.`;

      const response = await aiService.chat(prompt, []);
      const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const draft = JSON.parse(cleanResponse);

      // Save draft to database
      await supabaseAdmin.from('ai_email_drafts').insert({
        user_id: userId,
        inbox_email_id: inboxEmailId,
        to_address: email.from.address,
        subject: draft.subject,
        body: draft.body,
        ai_confidence: draft.confidence || 0.8,
        ai_reasoning: draft.reasoning,
        tone: draft.tone || 'professional',
        status: 'pending',
      });

      console.log('✅ AI draft generated for email:', email.subject);
    } catch (error) {
      console.error('Generate draft error:', error);
    }
  }

  /**
   * Generate AI draft for an existing email in database
   */
  async generateDraftForEmail(userId: string, email: any): Promise<any> {
    try {
      const prompt = `Generate a professional email response:

Original Email:
From: ${email.from_address} ${email.from_name ? `(${email.from_name})` : ''}
Subject: ${email.subject}
Body: ${email.body_text.substring(0, 1500)}

Generate a response in this JSON format:
{
  "subject": "Re: ${email.subject}",
  "body": "Professional response body",
  "tone": "professional|friendly|formal",
  "reasoning": "Why this response is appropriate",
  "confidence": 0.85
}

Make the response:
- Professional and courteous
- Address the sender's concerns
- Keep it concise (2-3 paragraphs max)
- Sign off appropriately

Respond ONLY with valid JSON.`;

      const response = await aiService.chat(prompt, []);
      const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const draft = JSON.parse(cleanResponse);

      // Save draft to database
      const { data: savedDraft, error } = await supabaseAdmin
        .from('ai_email_drafts')
        .insert({
          user_id: userId,
          inbox_email_id: email.id,
          to_address: email.from_address,
          subject: draft.subject,
          body: draft.body,
          ai_confidence: draft.confidence || 0.8,
          ai_reasoning: draft.reasoning,
          tone: draft.tone || 'professional',
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save draft: ${error.message}`);
      }

      console.log('✅ AI draft generated for email:', email.subject);
      return savedDraft;
    } catch (error) {
      console.error('Generate draft error:', error);
      throw error;
    }
  }

  /**
   * Send approved draft
   */
  async sendApprovedDraft(draftId: string, userId: string): Promise<boolean> {
    try {
      console.log('📧 Sending draft:', draftId);

      // Get draft
      const { data: draft, error: draftError } = await supabaseAdmin
        .from('ai_email_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', userId)
        .single();

      if (draftError || !draft) {
        console.error('❌ Draft not found:', draftError);
        throw new Error('Draft not found');
      }

      console.log('✅ Draft found:', draft.subject);

      // Get user's IMAP config (we'll use it for SMTP - Gmail uses same credentials)
      const { data: imapConfigs } = await supabaseAdmin
        .from('user_imap_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (!imapConfigs || imapConfigs.length === 0) {
        console.error('❌ No IMAP configuration found');
        throw new Error('No email configuration found. Please configure IMAP/SMTP settings.');
      }

      const imapConfig = imapConfigs[0];
      const decryptedPassword = decrypt(imapConfig.imap_password);

      console.log('🔓 IMAP config decrypted, using for SMTP');

      // Use Gmail SMTP (same credentials as IMAP)
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: imapConfig.imap_user,
          pass: decryptedPassword,
        },
      });

      const bodyToSend = draft.edited_body || draft.body;

      console.log('📤 Sending email to:', draft.to_address);

      const info = await transporter.sendMail({
        from: imapConfig.imap_user,
        to: draft.to_address,
        cc: draft.cc_addresses?.join(', '),
        subject: draft.subject,
        text: bodyToSend,
        html: `<p>${bodyToSend.replace(/\n/g, '<br>')}</p>`,
      });

      console.log('✅ Email sent, message ID:', info.messageId);

      // Update draft status
      await supabaseAdmin
        .from('ai_email_drafts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_message_id: info.messageId,
        })
        .eq('id', draftId);

      console.log('✅ Draft status updated to sent');

      return true;
    } catch (error) {
      console.error('❌ Send draft error:', error);
      throw error;
    }
  }
}

export default new EmailInboxService();
