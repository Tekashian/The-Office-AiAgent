import nodemailer, { Transporter } from 'nodemailer';
import { EmailConfig } from '../types';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send an email
   */
  async sendEmail(config: EmailConfig): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
        subject: config.subject,
        text: config.text,
        html: config.html,
        attachments: config.attachments,
      });

      console.log(`📧 Email sent: ${info.messageId}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(configs: EmailConfig[]): Promise<void> {
    const promises = configs.map((config) => this.sendEmail(config));
    await Promise.all(promises);
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }
}

export default new EmailService();
