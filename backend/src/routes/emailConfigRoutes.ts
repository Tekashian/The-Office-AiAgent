import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { encrypt, decrypt } from '../utils/encryption';

const router = Router();

/**
 * GET /api/email-config
 * Get user's email configuration
 */
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('user_email_configs')
      .select('id, config_name, smtp_host, smtp_port, smtp_user, created_at, updated_at')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Database error', details: error.message });
      return;
    }

    res.json({ configs: data || [] });
    return;
  } catch (error) {
    console.error('Get email config error:', error);
    res.status(500).json({ error: 'Failed to fetch email configuration' });
    return;
  }
});

/**
 * POST /api/email-config
 * Create or update user's email configuration
 */
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { config_name, smtp_host, smtp_port, smtp_user, smtp_password } = req.body;

    // Validate required fields
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password'] 
      });
      return;
    }

    // Encrypt the password
    const encryptedPassword = encrypt(smtp_password);

    // Insert or update email configuration
    const { data, error } = await supabase
      .from('user_email_configs')
      .upsert({
        user_id: req.userId,
        config_name: config_name || 'Default',
        smtp_host,
        smtp_port: parseInt(smtp_port),
        smtp_user,
        smtp_password: encryptedPassword,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,config_name'
      })
      .select('id, config_name, smtp_host, smtp_port, smtp_user, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: 'Failed to save email configuration', details: error.message });
      return;
    }

    res.json({ 
      message: 'Email configuration saved successfully', 
      config: data 
    });
    return;
  } catch (error) {
    console.error('Save email config error:', error);
    res.status(500).json({ error: 'Failed to save email configuration' });
    return;
  }
});

/**
 * DELETE /api/email-config/:id
 * Delete user's email configuration
 */
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('user_email_configs')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      res.status(500).json({ error: 'Failed to delete configuration', details: error.message });
      return;
    }

    res.json({ message: 'Email configuration deleted successfully' });
    return;
  } catch (error) {
    console.error('Delete email config error:', error);
    res.status(500).json({ error: 'Failed to delete email configuration' });
    return;
  }
});

/**
 * POST /api/email-config/test
 * Test user's email configuration
 */
router.post('/test', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { config_name } = req.body;

    // Fetch email configuration
    const { data, error } = await supabase
      .from('user_email_configs')
      .select('*')
      .eq('user_id', req.userId)
      .eq('config_name', config_name || 'Default')
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Email configuration not found' });
      return;
    }

    // Decrypt password
    const decryptedPassword = decrypt(data.smtp_password);

    // Test connection using nodemailer
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: data.smtp_host,
      port: data.smtp_port,
      secure: data.smtp_port === 465,
      auth: {
        user: data.smtp_user,
        pass: decryptedPassword
      }
    });

    await transporter.verify();

    res.json({ message: 'Email configuration is valid and working' });
    return;
  } catch (error: any) {
    console.error('Test email config error:', error);
    res.status(500).json({ 
      error: 'Email configuration test failed', 
      details: error.message 
    });
    return;
  }
});

export default router;
