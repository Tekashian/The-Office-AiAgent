import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/supabase';
import { encrypt } from '../utils/encryption';
import emailInboxService from '../services/emailInboxService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/email-inbox/imap-config
 * Save IMAP configuration
 */
router.post('/imap-config', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('📥 IMAP config request received:', {
      userId: req.userId,
      body: { ...req.body, imap_password: '***' },
    });

    const {
      config_name,
      imap_host,
      imap_port,
      imap_user,
      imap_password,
      use_ssl,
      auto_scan,
      scan_interval_minutes,
    } = req.body;

    console.log('🔐 Encrypting password...');
    const encryptedPassword = encrypt(imap_password);
    console.log('✅ Password encrypted successfully');

    console.log('💾 Inserting into database (using service role to bypass RLS)...');
    const { data, error } = await supabaseAdmin
      .from('user_imap_configs')
      .insert({
        user_id: req.userId,
        config_name,
        imap_host,
        imap_port: imap_port || 993,
        imap_user,
        imap_password: encryptedPassword,
        use_ssl: use_ssl !== false,
        auto_scan: auto_scan !== false,
        scan_interval_minutes: scan_interval_minutes || 5,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      res.status(500).json({ error: 'Failed to save IMAP config', details: error.message });
      return;
    }

    console.log('✅ IMAP config saved successfully');
    res.json({ success: true, config: data });
  } catch (error) {
    console.error('❌ Save IMAP config error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/email-inbox/imap-config
 * Get user's IMAP configuration
 */
router.get('/imap-config', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('user_imap_configs')
      .select('id, config_name, imap_host, imap_port, imap_user, use_ssl, auto_scan, scan_interval_minutes, last_scan_at, is_active, created_at')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Database error', details: error.message });
      return;
    }

    res.json({ configs: data || [] });
  } catch (error) {
    console.error('Get IMAP config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email-inbox/scan
 * Manually trigger inbox scan
 */
router.post('/scan', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await emailInboxService.scanInbox(req.userId!);
    res.json({ ...result, success: true });
  } catch (error) {
    console.error('Scan inbox error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Scan failed',
    });
  }
});

/**
 * GET /api/email-inbox/emails
 * Get inbox emails
 */
router.get('/emails', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { unread_only, priority, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('emails_inbox')
      .select('*')
      .eq('user_id', req.userId)
      .order('received_at', { ascending: false })
      .limit(Number(limit));

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    if (priority) {
      query = query.eq('ai_priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: 'Database error', details: error.message });
      return;
    }

    res.json({ emails: data || [] });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/email-inbox/emails/:id
 * Get single email with details
 */
router.get('/emails/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    logger.debug('Fetching email', { emailId: id, userId: req.userId });

    const { data: email, error } = await supabaseAdmin
      .from('emails_inbox')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !email) {
      logger.warn('Email not found', { emailId: id, userId: req.userId, error });
      res.status(404).json({ error: 'Email not found' });
      return;
    }

    logger.debug('Email found', { emailId: id, subject: email.subject, userId: req.userId });

    // Get AI draft if exists - use maybeSingle() instead of single()
    const { data: drafts, error: draftError } = await supabaseAdmin
      .from('ai_email_drafts')
      .select('*')
      .eq('inbox_email_id', id)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (draftError) {
      logger.warn('Draft fetch error', { emailId: id, error: draftError, userId: req.userId });
    }

    const draft = drafts && drafts.length > 0 ? drafts[0] : null;
    
    if (draft) {
      logger.debug('Draft found for email', { emailId: id, draftId: draft.id, userId: req.userId });
    } else {
      logger.debug('No draft found for email', { emailId: id, userId: req.userId });
    }

    res.json({ email, draft });
  } catch (error) {
    logger.error('Get email error', { error, emailId: req.params.id, userId: req.userId });
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * PATCH /api/email-inbox/emails/:id
 * Update email (mark as read, starred, etc)
 */
router.patch('/emails/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_read, is_starred, is_archived } = req.body;

    const updates: any = {};
    if (typeof is_read === 'boolean') updates.is_read = is_read;
    if (typeof is_starred === 'boolean') updates.is_starred = is_starred;
    if (typeof is_archived === 'boolean') updates.is_archived = is_archived;

    logger.debug('Updating email', { emailId: id, updates, userId: req.userId });

    const { data, error } = await supabaseAdmin
      .from('emails_inbox')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      logger.error('Email update failed', { emailId: id, error, userId: req.userId });
      res.status(500).json({ error: 'Update failed', details: error.message });
      return;
    }

    logger.info('Email updated successfully', { emailId: id, updates, userId: req.userId });
    res.json({ success: true, email: data });
  } catch (error) {
    logger.error('Update email error', { error, emailId: req.params.id, userId: req.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email-inbox/emails/:id/generate-draft
 * Generate AI draft for an email
 */
router.post('/emails/:id/generate-draft', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('🤖 Generating draft for email:', id);

    // Get email from database
    const { data: email, error: emailError } = await supabaseAdmin
      .from('emails_inbox')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (emailError || !email) {
      console.error('❌ Email not found:', emailError);
      res.status(404).json({ error: 'Email not found' });
      return;
    }

    // Check if draft already exists
    const { data: existingDraft } = await supabaseAdmin
      .from('ai_email_drafts')
      .select('*')
      .eq('inbox_email_id', id)
      .eq('user_id', req.userId)
      .single();

    if (existingDraft) {
      console.log('✅ Draft already exists, returning existing draft');
      res.json({ draft: existingDraft });
      return;
    }

    // Generate draft using email service
    const draft = await emailInboxService.generateDraftForEmail(req.userId!, email);

    console.log('✅ Draft generated successfully');
    res.json({ draft });
  } catch (error) {
    console.error('❌ Generate draft error:', error);
    res.status(500).json({ 
      error: 'Failed to generate draft', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/email-inbox/drafts
 * Get AI generated drafts
 */
router.get('/drafts', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status = 'pending' } = req.query;

    const { data, error } = await supabaseAdmin
      .from('ai_email_drafts')
      .select(`
        *,
        inbox_email:emails_inbox(
          id,
          from_address,
          from_name,
          subject,
          received_at
        )
      `)
      .eq('user_id', req.userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Database error', details: error.message });
      return;
    }

    res.json({ drafts: data || [] });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/email-inbox/drafts/:id
 * Update draft (edit body, approve, reject)
 */
router.patch('/drafts/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, edited_body } = req.body;

    console.log('📝 Updating draft:', id, { status, edited_body_length: edited_body?.length });

    const updates: any = {};
    if (status) updates.status = status;
    if (edited_body !== undefined) {
      updates.edited_body = edited_body;
      updates.user_edited = true;
    }

    const { data, error } = await supabaseAdmin
      .from('ai_email_drafts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update draft error:', error);
      res.status(500).json({ error: 'Update failed', details: error.message });
      return;
    }

    console.log('✅ Draft updated successfully');
    res.json({ success: true, draft: data });
  } catch (error) {
    console.error('❌ Update draft error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email-inbox/drafts/:id/send
 * Send approved draft
 */
router.post('/drafts/:id/send', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await emailInboxService.sendApprovedDraft(id, req.userId!);

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send draft error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Send failed',
    });
  }
});

/**
 * GET /api/email-inbox/stats
 * Get inbox statistics
 */
router.get('/stats', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    logger.debug('Fetching email inbox stats', { userId: req.userId });
    
    const [unreadResult, urgentResult, draftsResult] = await Promise.all([
      supabaseAdmin
        .from('emails_inbox')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.userId)
        .eq('is_read', false),
      
      supabaseAdmin
        .from('emails_inbox')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.userId)
        .eq('ai_priority', 'urgent'),
      
      supabaseAdmin
        .from('ai_email_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.userId)
        .eq('status', 'pending'),
    ]);

    // Check for errors in any query
    if (unreadResult.error) {
      logger.error('Failed to count unread emails', { error: unreadResult.error, userId: req.userId });
    }
    if (urgentResult.error) {
      logger.error('Failed to count urgent emails', { error: urgentResult.error, userId: req.userId });
    }
    if (draftsResult.error) {
      logger.error('Failed to count pending drafts', { error: draftsResult.error, userId: req.userId });
    }

    const stats = {
      unread: unreadResult.count || 0,
      urgent: urgentResult.count || 0,
      pending_drafts: draftsResult.count || 0,
    };

    logger.info('Email inbox stats retrieved', { userId: req.userId, stats });
    res.json(stats);
  } catch (error) {
    logger.error('Get stats error', { error, userId: req.userId });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
