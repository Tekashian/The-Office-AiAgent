import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { ScraperService } from '../services/scraperService';

const router = Router();
const scraperService = new ScraperService();

/**
 * POST /api/scraper/scrape
 * Scrape a single webpage
 */
router.post('/scrape', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { url, selectors } = req.body;

    // Validate required fields
    if (!url) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['url'] 
      });
      return;
    }

    // Create scrape job
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .insert({
        user_id: req.userId,
        url,
        status: 'running'
      })
      .select()
      .single();

    if (jobError) {
      res.status(500).json({ error: 'Failed to create scrape job', details: jobError.message });
      return;
    }

    try {
      // Scrape webpage
      const result = await scraperService.scrapeWebPage({ url, selectors });

      // Update job as completed
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          result_data: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      res.json({ 
        message: 'Scraping completed successfully',
        jobId: job.id,
        result 
      });
      return;
    } catch (scrapeError: any) {
      // Update job as failed
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: scrapeError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      res.status(500).json({ 
        error: 'Scraping failed', 
        details: scrapeError.message,
        jobId: job.id
      });
      return;
    }
  } catch (error: any) {
    console.error('Scrape error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape webpage', 
      details: error.message 
    });
    return;
  }
});

/**
 * POST /api/scraper/scrape-multiple
 * Scrape multiple webpages
 */
router.post('/scrape-multiple', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { urls, selectors } = req.body;

    // Validate required fields
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'urls must be an array with at least one URL' 
      });
      return;
    }

    // Create scrape job
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .insert({
        user_id: req.userId,
        url: urls.join(', '),
        status: 'running'
      })
      .select()
      .single();

    if (jobError) {
      res.status(500).json({ error: 'Failed to create scrape job', details: jobError.message });
      return;
    }

    try {
      // Scrape multiple pages
      const configs = urls.map((url: string) => ({ url, selectors }));
      const results = await scraperService.scrapeMultiplePages(configs);

      // Update job as completed
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          result_data: results,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      res.json({ 
        message: 'Multiple page scraping completed successfully',
        jobId: job.id,
        results 
      });
      return;
    } catch (scrapeError: any) {
      // Update job as failed
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: scrapeError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      res.status(500).json({ 
        error: 'Multiple page scraping failed', 
        details: scrapeError.message,
        jobId: job.id
      });
      return;
    }
  } catch (error: any) {
    console.error('Scrape multiple error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape multiple webpages', 
      details: error.message 
    });
    return;
  }
});

/**
 * GET /api/scraper/jobs
 * Get user's scraping jobs
 */
router.get('/jobs', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let query = supabase
      .from('scrape_jobs')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: 'Failed to fetch scrape jobs', details: error.message });
      return;
    }

    res.json({ jobs: data || [] });
    return;
  } catch (error) {
    console.error('Get scrape jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch scrape jobs' });
    return;
  }
});

/**
 * GET /api/scraper/jobs/:id
 * Get a specific scraping job
 */
router.get('/jobs/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Scrape job not found' });
      return;
    }

    res.json({ job: data });
    return;
  } catch (error) {
    console.error('Get scrape job error:', error);
    res.status(500).json({ error: 'Failed to fetch scrape job' });
    return;
  }
});

/**
 * DELETE /api/scraper/jobs/:id
 * Delete a scraping job
 */
router.delete('/jobs/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('scrape_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      res.status(500).json({ error: 'Failed to delete scrape job', details: error.message });
      return;
    }

    res.json({ message: 'Scrape job deleted successfully' });
    return;
  } catch (error) {
    console.error('Delete scrape job error:', error);
    res.status(500).json({ error: 'Failed to delete scrape job' });
    return;
  }
});

export default router;
