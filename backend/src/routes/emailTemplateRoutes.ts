import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import aiService from '../services/aiService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

/**
 * GET /api/email-templates
 * Get all templates for user
 */
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;

    let query = supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('user_id', req.userId)
      .order('updated_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Fetch templates error:', error);
      res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
      return;
    }

    res.json(data || []);
  } catch (error: any) {
    console.error('❌ Get templates error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * POST /api/email-templates
 * Create new template
 */
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, subject, body, category, variables } = req.body;

    if (!name || !subject || !body) {
      res.status(400).json({ error: 'Missing required fields: name, subject, body' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        user_id: req.userId,
        name,
        description,
        subject,
        body,
        category,
        variables: variables || []
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to create template', details: error.message });
      return;
    }

    res.json({ template: data });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/email-templates/:id
 * Update template
 */
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, subject, body, category, is_favorite } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (subject !== undefined) updates.subject = subject;
    if (body !== undefined) updates.body = body;
    if (category !== undefined) updates.category = category;
    if (is_favorite !== undefined) updates.is_favorite = is_favorite;

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to update template', details: error.message });
      return;
    }

    res.json({ template: data });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/email-templates/:id
 * Delete template
 */
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      res.status(500).json({ error: 'Failed to delete template', details: error.message });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email-templates/:id/use
 * Mark template as used (increment usage count)
 */
router.post('/:id/use', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin.rpc('increment_template_usage', {
      template_id: id,
      user_id: req.userId
    });

    if (error) {
      // Fallback: fetch current count, increment, and update
      const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('usage_count')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();
      
      if (template) {
        await supabaseAdmin
          .from('email_templates')
          .update({
            usage_count: template.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', req.userId);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email-templates/generate
 * Generate email template using AI based on category
 */
router.post('/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, context } = req.body;

    if (!category) {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    console.log(`🤖 Generating email template for category: ${category}`);
    
    const template = await aiService.generateEmailTemplate(category, context);
    
    console.log('✅ Template generated successfully');
    
    res.json({
      subject: template.subject,
      body: template.body,
      category
    });
  } catch (error: any) {
    console.error('❌ Generate template error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate template',
      details: error.message 
    });
  }
});

/**
 * POST /api/email-templates/upload-attachment
 * Upload email attachment
 */
router.post('/upload-attachment', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('email_attachments')
      .insert({
        user_id: req.userId,
        filename: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to save attachment', details: error.message });
      return;
    }

    res.json({ attachment: data });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/email-templates/attachments/:id
 * Get attachment file
 */
router.get('/attachments/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: attachment, error } = await supabaseAdmin
      .from('email_attachments')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    res.download(attachment.file_path, attachment.filename);
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
