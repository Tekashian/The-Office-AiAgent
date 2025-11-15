import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { PDFService } from '../services/pdfService';
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
 * POST /api/pdf/generate
 * Generate a PDF document
 */
router.post('/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, filename } = req.body;

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

    // Generate PDF
    await pdfService.generatePDF(content, outputPath, { title });

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
    console.error('Generate PDF error:', error);
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

    const { data, error } = await supabase
      .from('pdf_files')
      .select('id, filename, title, file_size, created_at')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      res.status(500).json({ error: 'Failed to fetch PDF files', details: error.message });
      return;
    }

    const pdfs = (data || []).map(pdf => ({
      ...pdf,
      downloadUrl: `/api/pdf/download/${pdf.id}`
    }));

    res.json({ pdfs });
    return;
  } catch (error) {
    console.error('List PDFs error:', error);
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

    // Fetch PDF record
    const { data, error } = await supabase
      .from('pdf_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(data.file_path)) {
      res.status(404).json({ error: 'PDF file not found on disk' });
      return;
    }

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

    // Fetch PDF record
    const { data, error: fetchError } = await supabase
      .from('pdf_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (fetchError || !data) {
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    // Delete file from disk
    if (fs.existsSync(data.file_path)) {
      fs.unlinkSync(data.file_path);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('pdf_files')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (deleteError) {
      res.status(500).json({ error: 'Failed to delete PDF record', details: deleteError.message });
      return;
    }

    res.json({ message: 'PDF file deleted successfully' });
    return;
  } catch (error) {
    console.error('Delete PDF error:', error);
    res.status(500).json({ error: 'Failed to delete PDF file' });
    return;
  }
});

export default router;
