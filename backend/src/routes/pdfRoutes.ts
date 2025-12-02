import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/supabase';
import { PDFService } from '../services/pdfService';
import aiService from '../services/aiService';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const router = Router();
const pdfService = new PDFService();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * GET /api/pdf/templates
 * Get all PDF templates for user
 */
router.get('/templates', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;

    let query = supabaseAdmin
      .from('pdf_templates')
      .select('*')
      .eq('user_id', req.userId)
      .order('updated_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Fetch PDF templates error', error);
      // If table doesn't exist yet, return empty array instead of 500
      if (error.message && error.message.includes('does not exist')) {
        logger.warn('pdf_templates table does not exist yet, returning empty array');
        res.json([]);
        return;
      }
      res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
      return;
    }

    res.json(data || []);
  } catch (error: any) {
    logger.error('Get PDF templates error', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * POST /api/pdf/templates
 * Create new PDF template
 */
router.post('/templates', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, content, category } = req.body;

    if (!name || !content) {
      res.status(400).json({ error: 'Missing required fields: name, content' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('pdf_templates')
      .insert({
        user_id: req.userId,
        name,
        description,
        content,
        category: category || 'General'
      })
      .select()
      .single();

    if (error) {
      logger.error('Create PDF template error', error);
      res.status(500).json({ error: 'Failed to create template', details: error.message });
      return;
    }

    res.status(201).json(data);
  } catch (error: any) {
    logger.error('Create PDF template error', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * PUT /api/pdf/templates/:id
 * Update PDF template
 */
router.put('/templates/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, content, category, is_favorite } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (is_favorite !== undefined) updates.is_favorite = is_favorite;

    const { data, error } = await supabaseAdmin
      .from('pdf_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      logger.error('Update PDF template error', error);
      res.status(500).json({ error: 'Failed to update template', details: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(data);
  } catch (error: any) {
    logger.error('Update PDF template error', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * DELETE /api/pdf/templates/:id
 * Delete PDF template
 */
router.delete('/templates/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('pdf_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      logger.error('Delete PDF template error', error);
      res.status(500).json({ error: 'Failed to delete template', details: error.message });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ Delete PDF template error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * POST /api/pdf/templates/:id/use
 * Increment usage count for template
 */
router.post('/templates/:id/use', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: template } = await supabaseAdmin
      .from('pdf_templates')
      .select('usage_count')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();
    
    if (template) {
      await supabaseAdmin
        .from('pdf_templates')
        .update({
          usage_count: template.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', req.userId);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Use PDF template error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/pdf/templates/generate
 * Generate PDF template content using AI based on category
 */
router.post('/templates/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, context } = req.body;
    const userId = req.userId;

    if (!category) {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    logger.info('Generating PDF template', { category, userId, hasContext: !!context });
    
    // Use generateText method to create PDF content
    const prompt = context 
      ? `Generate professional PDF content for category: ${category}. Context: ${context}`
      : `Generate professional PDF content for category: ${category}`;
    
    const content = await aiService.generateText(prompt, userId);
    
    logger.info('PDF template generated successfully', { contentLength: content.length });
    
    res.json({
      content,
      category
    });
  } catch (error: any) {
    logger.error('Generate PDF template error', error);
    res.status(500).json({ 
      error: 'Failed to generate template',
      details: error.message 
    });
  }
});

/**
 * POST /api/pdf/generate
 * Generate a PDF document
 */
router.post('/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, filename } = req.body;

    logger.info('Generating PDF', { title, contentLength: content?.length, filename });

    // Validate required fields
    if (!title || !content) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'content'] 
      });
      return;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = (filename || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputFilename = `${req.userId}_${timestamp}_${safeFilename}.pdf`;
    const outputPath = path.join(UPLOADS_DIR, outputFilename);

    logger.debug('PDF output path', { outputPath });

    // Generate PDF
    await pdfService.generatePDF(content, outputPath, { title });

    logger.info('PDF generated successfully');

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeInBytes = stats.size;

    logger.debug('Saving PDF to database');

    // Save to database - USE supabaseAdmin
    const { data, error } = await supabaseAdmin
      .from('pdf_files')
      .insert({
        user_id: req.userId,
        filename: outputFilename,
        title,
        file_path: outputPath,
        file_size: fileSizeInBytes
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save PDF record', error);
      res.status(500).json({ error: 'Failed to save PDF record', details: error.message });
      return;
    }

    logger.info('PDF saved to database', { pdfId: data.id });

    res.json({ 
      message: 'PDF generated successfully', 
      pdf: {
        id: data.id,
        filename: data.filename,
        title: data.title,
        fileSize: data.file_size,
        downloadUrl: `/api/pdf/download/${data.id}`
      }
    });
    return;
  } catch (error: any) {
    logger.error('Generate PDF error', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
    return;
  }
});

/**
 * POST /api/pdf/generate-structured
 * Generate a structured PDF document with sections
 */
router.post('/generate-structured', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, sections, filename } = req.body;

    // Validate required fields
    if (!title || !Array.isArray(sections) || sections.length === 0) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'sections (array)'] 
      });
      return;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = (filename || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputFilename = `${req.userId}_${timestamp}_${safeFilename}.pdf`;
    const outputPath = path.join(UPLOADS_DIR, outputFilename);

    // Generate structured PDF
    const structuredData = { title, sections };
    await pdfService.generateStructuredPDF(structuredData, outputPath);

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeInBytes = stats.size;

    // Save to database
    const { data, error } = await supabase
      .from('pdf_files')
      .insert({
        user_id: req.userId,
        filename: outputFilename,
        title,
        file_path: outputPath,
        file_size: fileSizeInBytes
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save PDF record', error);
      res.status(500).json({ error: 'Failed to save PDF record', details: error.message });
      return;
    }

    res.json({ 
      message: 'Structured PDF generated successfully', 
      pdf: {
        id: data.id,
        filename: data.filename,
        title: data.title,
        fileSize: data.file_size,
        downloadUrl: `/api/pdf/download/${data.id}`
      }
    });
    return;
  } catch (error: any) {
    logger.error('Generate structured PDF error', error);
    res.status(500).json({ 
      error: 'Failed to generate structured PDF', 
      details: error.message 
    });
    return;
  }
});

/**
 * GET /api/pdf/list
 * Get user's PDF files (from database and Supabase Storage)
 */
router.get('/list', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    logger.info('Fetching PDF list', { userId: req.userId });

    // Fetch from database (legacy PDFs)
    const { data: dbPdfs, error: dbError } = await supabaseAdmin
      .from('pdf_files')
      .select('id, filename, title, file_size, created_at')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (dbError) {
      logger.error('Failed to fetch PDF files from database', dbError);
    }

    // Fetch from Supabase Storage (cron-generated PDFs)
    const { data: storagePdfs, error: storageError } = await supabaseAdmin.storage
      .from('generated-pdfs')
      .list(req.userId, {
        limit: Number(limit),
        offset: Number(offset),
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      logger.error('Failed to fetch PDFs from storage', storageError);
    }

    logger.debug('Found PDFs', { dbCount: dbPdfs?.length || 0, storageCount: storagePdfs?.length || 0 });

    // Combine and format both sources
    const dbPdfsList = (dbPdfs || []).map(pdf => ({
      ...pdf,
      downloadUrl: `/api/pdf/download/${pdf.id}`,
      source: 'database'
    }));

    const storagePdfsList = (storagePdfs || []).map(pdf => {
      // Generate download URL
      return {
        id: pdf.id,
        filename: pdf.name,
        title: pdf.name.replace('.pdf', ''),
        file_size: pdf.metadata?.size || 0,
        created_at: pdf.created_at,
        downloadUrl: `/api/pdf/download-storage/${req.userId}/${encodeURIComponent(pdf.name)}`,
        source: 'storage'
      };
    });

    // Merge and sort by date
    const allPdfs = [...dbPdfsList, ...storagePdfsList].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({ pdfs: allPdfs });
    return;
  } catch (error) {
    logger.error('List PDFs error', error);
    res.status(500).json({ error: 'Failed to list PDF files' });
    return;
  }
});

/**
 * GET /api/pdf/download/:id
 * Download a PDF file from database
 */
router.get('/download/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    logger.info('Download request for PDF', { pdfId: id, userId: req.userId });

    // Fetch PDF record
    const { data, error } = await supabaseAdmin
      .from('pdf_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      logger.error('PDF not found in database', error);
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    logger.debug('PDF record found', { filename: data.filename, path: data.file_path });

    // Check if file exists
    if (!fs.existsSync(data.file_path)) {
      logger.error('PDF file not found on disk', null, { path: data.file_path });
      res.status(404).json({ error: 'PDF file not found on disk' });
      return;
    }

    logger.debug('Sending file');

    // Send file
    res.download(data.file_path, data.filename);
    return;
  } catch (error) {
    logger.error('Download PDF error', error);
    res.status(500).json({ error: 'Failed to download PDF' });
    return;
  }
});

/**
 * GET /api/pdf/download-storage/:userId/:filename
 * Download a PDF file from Supabase Storage
 */
router.get('/download-storage/:userId/:filename', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, filename } = req.params;
    const filepath = `${userId}/${filename}`;
    
    logger.info('Storage download request', { filepath });
    
    // Verify user owns this file
    if (userId !== req.userId) {
      logger.warn('Unauthorized access attempt', { userId, requestedBy: req.userId });
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    // Generate signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('generated-pdfs')
      .createSignedUrl(filepath, 3600); // 1 hour
    
    if (urlError || !urlData) {
      logger.error('Failed to generate signed URL', urlError);
      res.status(404).json({ error: 'PDF not found' });
      return;
    }
    
    logger.debug('Redirecting to signed URL');
    
    // Redirect to signed URL
    res.redirect(urlData.signedUrl);
    return;
  } catch (error) {
    logger.error('Download storage PDF error', error);
    res.status(500).json({ error: 'Failed to download PDF' });
    return;
  }
});

/**
 * DELETE /api/pdf/:id
 * Delete a PDF file
 */
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    logger.info('Delete request for PDF', { pdfId: id });

    // Fetch PDF record
    const { data, error: fetchError } = await supabaseAdmin
      .from('pdf_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (fetchError || !data) {
      logger.error('PDF not found', fetchError);
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    // Delete file from disk
    if (fs.existsSync(data.file_path)) {
      fs.unlinkSync(data.file_path);
      logger.debug('File deleted from disk');
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('pdf_files')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (deleteError) {
      logger.error('Failed to delete from database', deleteError);
      res.status(500).json({ error: 'Failed to delete PDF record', details: deleteError.message });
      return;
    }

    logger.info('PDF deleted successfully', { pdfId: id });
    res.json({ message: 'PDF file deleted successfully' });
    return;
  } catch (error) {
    logger.error('Delete PDF error', error);
    res.status(500).json({ error: 'Failed to delete PDF file' });
    return;
  }
});

export default router;
