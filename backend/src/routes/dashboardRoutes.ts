import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the authenticated user
 */
router.get('/stats', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Get cron jobs stats
    const { data: cronJobs } = await supabaseAdmin
      .from('cron_jobs')
      .select('id, enabled, status, last_run, execution_count')
      .eq('user_id', userId);

    // Count active (enabled) cron jobs
    const activeTasks = cronJobs?.filter(job => job.enabled).length || 0;

    // Count completed today (jobs that ran today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = cronJobs?.filter(job => {
      if (!job.last_run) return false;
      const lastRun = new Date(job.last_run);
      return lastRun >= today;
    }).length || 0;

    // Count pending (enabled but never run)
    const pendingTasks = cronJobs?.filter(job => job.enabled && !job.last_run).length || 0;

    // Count failed (status = 'failed')
    const failedTasks = cronJobs?.filter(job => job.status === 'failed').length || 0;

    // Get notifications count
    const { count: unreadNotifications } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    // Get emails sent count
    const { count: emailsSent } = await supabaseAdmin
      .from('emails_sent')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get PDF files count
    const { count: pdfFiles } = await supabaseAdmin
      .from('pdf_files')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get emails in inbox
    const { count: emailsInbox } = await supabaseAdmin
      .from('emails_inbox')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      tasks: {
        active: activeTasks,
        completedToday,
        pending: pendingTasks,
        failed: failedTasks
      },
      resources: {
        emailsSent: emailsSent || 0,
        pdfFiles: pdfFiles || 0,
        emailsInbox: emailsInbox || 0,
        unreadNotifications: unreadNotifications || 0
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/dashboard/recent-tasks
 * Get recent tasks (cron jobs) with their execution details
 */
router.get('/recent-tasks', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data: cronJobs, error } = await supabaseAdmin
      .from('cron_jobs')
      .select('id, name, task_type, status, last_run, enabled, execution_count, created_at')
      .eq('user_id', userId)
      .order('last_run', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      res.status(500).json({ error: 'Failed to fetch recent tasks', details: error.message });
      return;
    }

    // Transform to frontend format
    const tasks = (cronJobs || []).map(job => {
      let status = 'pending';
      if (!job.enabled) {
        status = 'disabled';
      } else if (job.status === 'failed') {
        status = 'failed';
      } else if (job.status === 'running') {
        status = 'in_progress';
      } else if (job.last_run) {
        status = 'completed';
      }

      // Calculate time ago
      let timeAgo = 'Nigdy nie uruchomione';
      if (job.last_run) {
        const lastRun = new Date(job.last_run);
        const now = new Date();
        const diffMs = now.getTime() - lastRun.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
          timeAgo = 'przed chwilą';
        } else if (diffMins < 60) {
          timeAgo = `${diffMins} min temu`;
        } else if (diffHours < 24) {
          timeAgo = `${diffHours} godz. temu`;
        } else {
          timeAgo = `${diffDays} dni temu`;
        }
      }

      return {
        id: job.id,
        type: job.task_type,
        description: job.name,
        status,
        priority: job.enabled ? 'high' : 'low',
        time: timeAgo,
        executionCount: job.execution_count || 0
      };
    });

    res.json({ tasks });

  } catch (error) {
    console.error('Recent tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch recent tasks' });
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity across all features
 */
router.get('/activity', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get recent notifications
    const { data: notifications } = await supabaseAdmin
      .from('notifications')
      .select('id, type, title, message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Transform to activity feed format
    const activities = (notifications || []).map(notif => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      description: notif.message,
      timestamp: notif.created_at
    }));

    res.json({ activities });

  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

export default router;
