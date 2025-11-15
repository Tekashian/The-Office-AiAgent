import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/supabase';
import { PDFService } from '../services/pdfService';
import aiService from '../services/aiService';
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
      console.error('❌ Fetch PDF templates error:', error);
      // If table doesn't exist yet, return empty array instead of 500
      if (error.message && error.message.includes('does not exist')) {
        console.log('⚠️ pdf_templates table does not exist yet, returning empty array');
        res.json([]);
        return;
      }
      res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
      return;
    }

    res.json(data || []);
  } catch (error: any) {
    console.error('❌ Get PDF templates error:', error);
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
      console.error('❌ Create PDF template error:', error);
      res.status(500).json({ error: 'Failed to create template', details: error.message });
      return;
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('❌ Create PDF template error:', error);
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
      console.error('❌ Update PDF template error:', error);
      res.status(500).json({ error: 'Failed to update template', details: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error('❌ Update PDF template error:', error);
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
      console.error('❌ Delete PDF template error:', error);
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
    console.error('❌ Use PDF template error:', error);
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

    if (!category) {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    console.log(`🤖 Generating PDF template for category: ${category}`);
    console.log(`📝 Context:`, context);
    
    if (typeof aiService.generatePDFContent !== 'function') {
      console.error('❌ generatePDFContent method not found on aiService');
      res.status(500).json({ error: 'AI service method not available' });
      return;
    }
    
    const content = await aiService.generatePDFContent(category, context);
    
    console.log('✅ PDF template generated successfully');
    console.log('📄 Content length:', content.length);
    
    res.json({
      content,
      category
    });
  } catch (error: any) {
    console.error('❌ Generate PDF template error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
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

    console.log('📄 Generating PDF:', { title, contentLength: content?.length, filename });

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

    console.log('📁 Output path:', outputPath);

    // Generate PDF
    await pdfService.generatePDF(content, outputPath, { title });

    console.log('✅ PDF generated successfully');

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeInBytes = stats.size;

    console.log('💾 Saving to database...');

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
      console.error('❌ Failed to save PDF record:', error);
      res.status(500).json({ error: 'Failed to save PDF record', details: error.message });
      return;
    }

    console.log('✅ PDF saved to database:', data.id);

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
    console.error('❌ Generate PDF error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
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
      console.error('Failed to save PDF record:', error);
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
    console.error('Generate structured PDF error:', error);
    res.status(500).json({ 
      error: 'Failed to generate structured PDF', 
      details: error.message 
    });
    return;
  }
});

/**
 * GET /api/pdf/list
 * Get user's PDF files
 */
router.get('/list', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    console.log('📋 Fetching PDF list for user:', req.userId);

    const { data, error } = await supabaseAdmin
      .from('pdf_files')
      .select('id, filename, title, file_size, created_at')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error('❌ Failed to fetch PDF files:', error);
      res.status(500).json({ error: 'Failed to fetch PDF files', details: error.message });
      return;
    }

    console.log('✅ Found PDFs:', data?.length || 0);

    const pdfs = (data || []).map(pdf => ({
      ...pdf,
      downloadUrl: `/api/pdf/download/${pdf.id}`
    }));

    res.json({ pdfs });
    return;
  } catch (error) {
    console.error('❌ List PDFs error:', error);
    res.status(500).json({ error: 'Failed to list PDF files' });
    return;
  }
});

/**
 * GET /api/pdf/download/:id
 * Download a PDF file
 */
router.get('/download/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    console.log('📥 Download request for PDF:', id, 'User:', req.userId);

    // Fetch PDF record
    const { data, error } = await supabaseAdmin
      .from('pdf_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      console.error('❌ PDF not found in database:', error);
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    console.log('📄 PDF record found:', data.filename);
    console.log('📁 File path:', data.file_path);

    // Check if file exists
    if (!fs.existsSync(data.file_path)) {
      console.error('❌ PDF file not found on disk:', data.file_path);
      res.status(404).json({ error: 'PDF file not found on disk' });
      return;
    }

    console.log('✅ Sending file...');

    // Send file
    res.download(data.file_path, data.filename);
    return;
  } catch (error) {
    console.error('Download PDF error:', error);
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

    console.log('🗑️ Delete request for PDF:', id);

    // Fetch PDF record
    const { data, error: fetchError } = await supabaseAdmin
      .from('pdf_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (fetchError || !data) {
      console.error('❌ PDF not found:', fetchError);
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    // Delete file from disk
    if (fs.existsSync(data.file_path)) {
      fs.unlinkSync(data.file_path);
      console.log('✅ File deleted from disk');
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('pdf_files')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (deleteError) {
      console.error('❌ Failed to delete from database:', deleteError);
      res.status(500).json({ error: 'Failed to delete PDF record', details: deleteError.message });
      return;
    }

    console.log('✅ PDF deleted successfully');
    res.json({ message: 'PDF file deleted successfully' });
    return;
  } catch (error) {
    console.error('Delete PDF error:', error);
    res.status(500).json({ error: 'Failed to delete PDF file' });
    return;
  }
});

export default router;
