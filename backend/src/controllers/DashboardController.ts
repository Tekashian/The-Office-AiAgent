import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { BaseController } from './BaseController';
import { AuthenticatedRequest } from '../middleware/auth';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../config/supabase';

/**
 * Dashboard Controller
 * Handles dashboard statistics with caching
 */
class DashboardController extends BaseController {
  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics (cached for 5 minutes)
   */
  getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = this.getUserId(req);
    const cacheKey = `dashboard:stats:${userId}`;

    // Try cache first
    const stats = await cache.getOrSet(
      cacheKey,
      async () => {
        logger.debug('Fetching dashboard stats from database', { userId });

        // Fetch all stats in parallel
        const [emails, pdfs, scrapers, crons] = await Promise.all([
          supabaseAdmin
            .from('email_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabaseAdmin
            .from('pdf_files')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabaseAdmin
            .from('scraper_jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabaseAdmin
            .from('cron_jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
        ]);

        return {
          emailsSent: emails.count || 0,
          pdfsGenerated: pdfs.count || 0,
          scrapersActive: scrapers.count || 0,
          cronsScheduled: crons.count || 0,
          lastUpdated: new Date().toISOString(),
        };
      },
      300000 // Cache for 5 minutes
    );

    this.success(res, stats);
  });

  /**
   * POST /api/dashboard/refresh
   * Invalidate dashboard cache
   */
  refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = this.getUserId(req);
    const cacheKey = `dashboard:stats:${userId}`;

    cache.delete(cacheKey);
    logger.info('Dashboard cache invalidated', { userId });

    this.success(res, { message: 'Cache cleared' });
  });
}

export default new DashboardController();
