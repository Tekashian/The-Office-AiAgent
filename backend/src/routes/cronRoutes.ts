import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { CronService } from '../services/cronService';

const router = Router();
const cronService = new CronService();

/**
 * POST /api/cron/create
 * Create a new cron job
 */
router.post('/create', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, schedule, task_type, task_config, enabled = true } = req.body;

    // Validate required fields
    if (!name || !schedule || !task_type) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['name', 'schedule', 'task_type'] 
      });
      return;
    }

    // Save to database
    const { data, error} = await supabaseAdmin
      .from('cron_jobs')
      .insert({
        user_id: req.userId,
        name,
        schedule,
        task_type,
        task_config: task_config || {},
        enabled,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to create cron job', details: error.message });
      return;
    }

    // Start the cron job if enabled
    if (enabled) {
      try {
        cronService.scheduleJob({
          name: data.id,
          schedule: schedule,
          enabled: true,
          task: async () => {
            console.log(`Executing cron job: ${name} (${data.id})`);
            
            // Update last run time and execution count
            await supabaseAdmin
              .from('cron_jobs')
              .update({
                last_run: new Date().toISOString(),
                execution_count: data.execution_count + 1,
                status: 'running'
              })
              .eq('id', data.id);

            // Here you would execute the actual task based on task_type
            // For example: send email, generate PDF, scrape website, etc.

            // Update status back to active
            await supabaseAdmin
              .from('cron_jobs')
              .update({
                status: 'active'
              })
              .eq('id', data.id);
          }
        });

        await supabaseAdmin
          .from('cron_jobs')
          .update({ status: 'active' })
          .eq('id', data.id);
      } catch (cronError: any) {
        console.error('Failed to start cron job:', cronError);
      }
    }

    res.json({ 
      message: 'Cron job created successfully', 
      job: data 
    });
    return;
  } catch (error: any) {
    console.error('Create cron job error:', error);
    res.status(500).json({ 
      error: 'Failed to create cron job', 
      details: error.message 
    });
    return;
  }
});

/**
 * GET /api/cron/jobs
 * Get user's cron jobs
 */
router.get('/jobs', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, enabled } = req.query;

    let query = supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (enabled !== undefined) {
      query = query.eq('enabled', enabled === 'true');
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: 'Failed to fetch cron jobs', details: error.message });
      return;
    }

    res.json({ jobs: data || [] });
    return;
  } catch (error) {
    console.error('Get cron jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch cron jobs' });
    return;
  }
});

/**
 * GET /api/cron/jobs/:id
 * Get a specific cron job
 */
router.get('/jobs/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Cron job not found' });
      return;
    }

    res.json({ job: data });
    return;
  } catch (error) {
    console.error('Get cron job error:', error);
    res.status(500).json({ error: 'Failed to fetch cron job' });
    return;
  }
});

/**
 * PUT /api/cron/jobs/:id
 * Update a cron job
 */
router.put('/jobs/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, schedule, task_type, task_config, enabled } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (schedule !== undefined) updates.schedule = schedule;
    if (task_type !== undefined) updates.task_type = task_type;
    if (task_config !== undefined) updates.task_config = task_config;
    if (enabled !== undefined) updates.enabled = enabled;

    const { data, error } = await supabaseAdmin
      .from('cron_jobs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Cron job not found or failed to update' });
      return;
    }

    // Restart the job if it was updated
    if (schedule !== undefined || enabled !== undefined) {
      cronService.stopJob(id);
      
      if (data.enabled) {
        cronService.scheduleJob({
          name: id,
          schedule: data.schedule,
          enabled: true,
          task: async () => {
            console.log(`Executing cron job: ${data.name} (${id})`);
            
            await supabaseAdmin
              .from('cron_jobs')
              .update({
                last_run: new Date().toISOString(),
                execution_count: data.execution_count + 1
              })
              .eq('id', id);
          }
        });
      }
    }

    res.json({ 
      message: 'Cron job updated successfully', 
      job: data 
    });
    return;
  } catch (error: any) {
    console.error('Update cron job error:', error);
    res.status(500).json({ 
      error: 'Failed to update cron job', 
      details: error.message 
    });
    return;
  }
});

/**
 * POST /api/cron/jobs/:id/start
 * Start a cron job
 */
router.post('/jobs/:id/start', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Cron job not found' });
      return;
    }

    cronService.startJob(id);

    await supabaseAdmin
      .from('cron_jobs')
      .update({ 
        enabled: true,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({ message: 'Cron job started successfully' });
    return;
  } catch (error: any) {
    console.error('Start cron job error:', error);
    res.status(500).json({ 
      error: 'Failed to start cron job', 
      details: error.message 
    });
    return;
  }
});

/**
 * POST /api/cron/jobs/:id/stop
 * Stop a cron job
 */
router.post('/jobs/:id/stop', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Cron job not found' });
      return;
    }

    cronService.stopJob(id);

    await supabaseAdmin
      .from('cron_jobs')
      .update({ 
        enabled: false,
        status: 'stopped',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({ message: 'Cron job stopped successfully' });
    return;
  } catch (error: any) {
    console.error('Stop cron job error:', error);
    res.status(500).json({ 
      error: 'Failed to stop cron job', 
      details: error.message 
    });
    return;
  }
});

/**
 * DELETE /api/cron/jobs/:id
 * Delete a cron job
 */
router.delete('/jobs/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Stop the job first
    cronService.stopJob(id);

    // Delete from database
    const { error } = await supabaseAdmin
      .from('cron_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      res.status(500).json({ error: 'Failed to delete cron job', details: error.message });
      return;
    }

    res.json({ message: 'Cron job deleted successfully' });
    return;
  } catch (error) {
    console.error('Delete cron job error:', error);
    res.status(500).json({ error: 'Failed to delete cron job' });
    return;
  }
});

export default router;
