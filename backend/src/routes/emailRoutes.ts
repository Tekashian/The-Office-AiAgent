import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { decrypt } from '../utils/encryption';
import nodemailer from 'nodemailer';

const router = Router();

/**
 * POST /api/email/send
 * Send an email using user's configured SMTP settings
 */
router.post('/send', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { to, subject, body, config_name } = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['to', 'subject', 'body'] 
      });
      return;
    }

    // Fetch user's email configuration
    const { data: emailConfig, error: configError } = await supabase
      .from('user_email_configs')
      .select('*')
      .eq('user_id', req.userId)
      .eq('config_name', config_name || 'Default')
      .single();

    if (configError || !emailConfig) {
      res.status(404).json({ 
        error: 'Email configuration not found', 
        message: 'Please configure your SMTP settings first' 
      });
      return;
    }

    // Decrypt password
    const decryptedPassword = decrypt(emailConfig.smtp_password);

    // Create transporter with user's configuration
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_port === 465,
      auth: {
        user: emailConfig.smtp_user,
        pass: decryptedPassword
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: emailConfig.smtp_user,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: body,
      html: body
    });

    // Log email to database
    const { error: logError } = await supabase
      .from('emails_sent')
      .insert({
        user_id: req.userId,
        recipient: Array.isArray(to) ? to.join(', ') : to,
        subject,
        body,
        status: 'sent',
        message_id: info.messageId
      });

    if (logError) {
      console.error('Failed to log email:', logError);
    }

    res.json({ 
      message: 'Email sent successfully', 
      messageId: info.messageId 
    });
    return;
  } catch (error: any) {
    console.error('Send email error:', error);

    // Log failed email
    try {
      await supabase
        .from('emails_sent')
        .insert({
          user_id: req.userId,
          recipient: req.body.to,
          subject: req.body.subject,
          body: req.body.body,
          status: 'failed',
          error_message: error.message
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
    return;
  }
});

/**
 * POST /api/email/send-bulk
 * Send bulk emails using user's configured SMTP settings
 */
router.post('/send-bulk', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { emails, config_name } = req.body;

    // Validate required fields
    if (!Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'emails must be an array with at least one email' 
      });
      return;
    }

    // Fetch user's email configuration
    const { data: emailConfig, error: configError } = await supabase
      .from('user_email_configs')
      .select('*')
      .eq('user_id', req.userId)
      .eq('config_name', config_name || 'Default')
      .single();

    if (configError || !emailConfig) {
      res.status(404).json({ 
        error: 'Email configuration not found', 
        message: 'Please configure your SMTP settings first' 
      });
      return;
    }

    // Decrypt password
    const decryptedPassword = decrypt(emailConfig.smtp_password);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_port === 465,
      auth: {
        user: emailConfig.smtp_user,
        pass: decryptedPassword
      }
    });

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Send emails
    for (const email of emails) {
      try {
        const info = await transporter.sendMail({
          from: emailConfig.smtp_user,
          to: email.to,
          subject: email.subject,
          text: email.body,
          html: email.body
        });

        // Log successful email
        await supabase
          .from('emails_sent')
          .insert({
            user_id: req.userId,
            recipient: email.to,
            subject: email.subject,
            body: email.body,
            status: 'sent',
            message_id: info.messageId
          });

        results.sent++;
      } catch (error: any) {
        console.error(`Failed to send email to ${email.to}:`, error);
        
        // Log failed email
        await supabase
          .from('emails_sent')
          .insert({
            user_id: req.userId,
            recipient: email.to,
            subject: email.subject,
            body: email.body,
            status: 'failed',
            error_message: error.message
          });

        results.failed++;
        results.errors.push({
          to: email.to,
          error: error.message
        });
      }
    }

    res.json({ 
      message: 'Bulk email operation completed', 
      results 
    });
    return;
  } catch (error: any) {
    console.error('Bulk email error:', error);
    res.status(500).json({ 
      error: 'Failed to send bulk emails', 
      details: error.message 
    });
    return;
  }
});

/**
 * GET /api/email/history
 * Get user's email history
 */
router.get('/history', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('emails_sent')
      .select('*')
      .eq('user_id', req.userId)
      .order('sent_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      res.status(500).json({ error: 'Failed to fetch email history', details: error.message });
      return;
    }

    res.json({ emails: data || [] });
    return;
  } catch (error) {
    console.error('Email history error:', error);
    res.status(500).json({ error: 'Failed to fetch email history' });
    return;
  }
});

export default router;
