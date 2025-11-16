import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { ScraperService } from '../services/scraperService';
import { createNotification } from './notificationRoutes';

const router = Router();
const scraperService = new ScraperService();

/**
 * GET /api/scraper
 * Get all scrape jobs for the user
 */
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, status, enabled } = req.query;

    let query = supabaseAdmin
      .from('scrape_jobs')
      .select('*, scrape_history(count)')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (enabled !== undefined) {
      query = query.eq('enabled', enabled === 'true');
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: 'Failed to fetch scrape jobs', details: error.message });
      return;
    }

    res.json({ jobs: data || [], total: data?.length || 0 });
  } catch (error) {
    console.error('Get scrape jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch scrape jobs' });
  }
});

/**
 * POST /api/scraper/create
 * Create a new scrape job with AI or manual configuration
 */
router.post('/create', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      url,
      description,
      extraction_type = 'manual',
      selectors,
      ai_prompt,
      filters,
      change_detection = false,
      alert_config,
      schedule,
      enabled = true
    } = req.body;

    if (!name || !url) {
      res.status(400).json({ error: 'Missing required fields: name, url' });
      return;
    }

    if (extraction_type === 'ai' && !ai_prompt) {
      res.status(400).json({ error: 'AI prompt required for AI extraction' });
      return;
    }

    if (extraction_type === 'manual' && !selectors) {
      res.status(400).json({ error: 'Selectors required for manual extraction' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .insert({
        user_id: req.userId,
        name,
        url,
        description,
        extraction_type,
        selectors: selectors || {},
        ai_prompt,
        filters: filters || {},
        change_detection,
        alert_config: alert_config || {},
        schedule,
        enabled,
        status: schedule ? 'scheduled' : 'pending'
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to create scrape job', details: error.message });
      return;
    }

    res.json({ 
      message: 'Scrape job created successfully',
      job: data
    });
  } catch (error: unknown) {
    console.error('Create scrape job error:', error);
    res.status(500).json({ error: 'Failed to create scrape job' });
  }
});

/**
 * PUT /api/scraper/:id
 * Update an existing scrape job
 */
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    delete updates.execution_count;

    const { data, error } = await supabaseAdmin
      .from('scrape_jobs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to update scrape job', details: error.message });
      return;
    }

    res.json({
      message: 'Scrape job updated successfully',
      job: data
    });
  } catch (error) {
    console.error('Update scrape job error:', error);
    res.status(500).json({ error: 'Failed to update scrape job' });
  }
});

/**
 * POST /api/scraper/:id/execute
 * Execute a scrape job immediately
 */
router.post('/:id/execute', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get scrape job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('scrape_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (jobError || !job) {
      res.status(404).json({ error: 'Scrape job not found' });
      return;
    }

    // Update status to running
    await supabaseAdmin
      .from('scrape_jobs')
      .update({ 
        status: 'running',
        last_run: new Date().toISOString()
      })
      .eq('id', id);

    const startTime = Date.now();

    try {
      let result;
      
      if (job.extraction_type === 'ai' || job.extraction_type === 'hybrid') {
        // AI-powered extraction
        result = await scraperService.scrapeWithAI({
          url: job.url,
          prompt: job.ai_prompt,
          selectors: job.extraction_type === 'hybrid' ? job.selectors : undefined
        });
      } else {
        // Manual extraction with selectors
        result = await scraperService.scrapeWebPage({
          url: job.url,
          selectors: job.selectors
        });
      }

      const duration = Date.now() - startTime;

      // Check for changes if enabled
      let changesDetected = null;
      let changeDetected = false;

      if (job.change_detection && job.last_data) {
        changesDetected = detectChanges(job.last_data, result);
        changeDetected = !!(changesDetected && Object.keys(changesDetected).length > 0);

        // Send notification if changes detected
        if (changeDetected) {
          await createNotification(
            req.userId!,
            'scraping_completed',
            `Zmiany wykryte: ${job.name}`,
            `Scraper wykrył zmiany na stronie ${job.url}`,
            {
              scrape_job_id: job.id,
              scrape_job_name: job.name,
              url: job.url,
              changes: changesDetected
            }
          );
        }
      }

      // Check alert conditions
      if (job.alert_config && Object.keys(job.alert_config).length > 0) {
        checkAlertConditions(job, result, req.userId!);
      }

      // Update job
      await supabaseAdmin
        .from('scrape_jobs')
        .update({
          status: 'completed',
          result_data: result,
          last_data: result,
          change_detected: changeDetected,
          last_change_at: changeDetected ? new Date().toISOString() : job.last_change_at,
          execution_count: (job.execution_count || 0) + 1,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      // Save to history
      await supabaseAdmin
        .from('scrape_history')
        .insert({
          scrape_job_id: id,
          status: 'success',
          data_extracted: result,
          changes_detected: changesDetected,
          items_count: Array.isArray(result) ? result.length : (result ? 1 : 0),
          duration_ms: duration
        });

      res.json({
        message: 'Scraping completed successfully',
        result,
        changeDetected,
        changes: changesDetected,
        duration_ms: duration
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update job as failed
      await supabaseAdmin
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      // Save failed attempt to history
      await supabaseAdmin
        .from('scrape_history')
        .insert({
          scrape_job_id: id,
          status: 'failed',
          error_message: errorMessage,
          duration_ms: Date.now() - startTime
        });

      // Send error notification
      await createNotification(
        req.userId!,
        'task_failed',
        `Scraping nieudany: ${job.name}`,
        `Błąd podczas scrapowania ${job.url}: ${errorMessage}`,
        {
          scrape_job_id: job.id,
          scrape_job_name: job.name,
          error: errorMessage
        }
      );

      res.status(500).json({
        error: 'Scraping failed',
        details: errorMessage
      });
    }
  } catch (error) {
    console.error('Execute scrape job error:', error);
    res.status(500).json({ error: 'Failed to execute scrape job' });
  }
});

/**
 * GET /api/scraper/:id/history
 * Get execution history for a scrape job
 */
router.get('/:id/history', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Verify job ownership
    const { data: job } = await supabaseAdmin
      .from('scrape_jobs')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!job) {
      res.status(404).json({ error: 'Scrape job not found' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('scrape_history')
      .select('*')
      .eq('scrape_job_id', id)
      .order('executed_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      res.status(500).json({ error: 'Failed to fetch history', details: error.message });
      return;
    }

    res.json({ history: data || [] });
  } catch (error) {
    console.error('Get scrape history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * DELETE /api/scraper/:id
 * Delete a scrape job
 */
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('scrape_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      res.status(500).json({ error: 'Failed to delete scrape job', details: error.message });
      return;
    }

    res.json({ message: 'Scrape job deleted successfully' });
  } catch (error) {
    console.error('Delete scrape job error:', error);
    res.status(500).json({ error: 'Failed to delete scrape job' });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Detect changes between old and new data
 */
function detectChanges(oldData: any, newData: any): any {
  if (!oldData || !newData) return null;

  const changes: any = {};

  // Simple comparison for objects
  if (typeof newData === 'object' && !Array.isArray(newData)) {
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        };
      }
    }
  }

  // Array comparison
  if (Array.isArray(newData) && Array.isArray(oldData)) {
    if (newData.length !== oldData.length) {
      changes.count = {
        old: oldData.length,
        new: newData.length
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Check alert conditions and send notifications
 */
async function checkAlertConditions(job: any, result: any, userId: string): Promise<void> {
  const config = job.alert_config;

  // Price drop alert
  if (config.price_drop_threshold && result.price && job.last_data?.price) {
    const oldPrice = parseFloat(job.last_data.price);
    const newPrice = parseFloat(result.price);
    const dropPercentage = ((oldPrice - newPrice) / oldPrice) * 100;

    if (dropPercentage >= config.price_drop_threshold) {
      await createNotification(
        userId,
        'info',
        `Spadek ceny: ${job.name}`,
        `Cena spadła o ${dropPercentage.toFixed(1)}% (${oldPrice} → ${newPrice})`,
        {
          scrape_job_id: job.id,
          old_price: oldPrice,
          new_price: newPrice,
          drop_percentage: dropPercentage
        }
      );
    }
  }

  // Keyword alert
  if (config.keywords && Array.isArray(config.keywords)) {
    const resultString = JSON.stringify(result).toLowerCase();
    const foundKeywords = config.keywords.filter((keyword: string) => 
      resultString.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      await createNotification(
        userId,
        'info',
        `Znaleziono słowa kluczowe: ${job.name}`,
        `Wykryto słowa: ${foundKeywords.join(', ')}`,
        {
          scrape_job_id: job.id,
          keywords: foundKeywords,
          url: job.url
        }
      );
    }
  }
}

/**
 * POST /api/scraper/analyze
 * Analyze page structure with AI
 */
router.post('/analyze', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const analysis = await scraperService.analyzePageStructure(url);

    res.json({
      message: 'Page analysis completed',
      analysis
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Analyze page error:', error);
    res.status(500).json({ error: 'Failed to analyze page', details: errorMessage });
  }
});

export default router;
