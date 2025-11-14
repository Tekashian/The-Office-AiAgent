import cron, { ScheduledTask } from 'node-cron';
import { CronJobConfig } from '../types';

export class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();

  /**
   * Schedule a new cron job
   */
  scheduleJob(config: CronJobConfig): void {
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron schedule: ${config.schedule}`);
    }

    if (this.jobs.has(config.name)) {
      console.warn(`Job ${config.name} already exists. Stopping old job.`);
      this.stopJob(config.name);
    }

    const task = cron.schedule(
      config.schedule,
      async () => {
        try {
          console.log(`⏰ Running scheduled job: ${config.name}`);
          await config.task();
          console.log(`✅ Job ${config.name} completed`);
        } catch (error) {
          console.error(`❌ Job ${config.name} failed:`, error);
        }
      }
    );

    if (!config.enabled) {
      task.stop();
    }

    this.jobs.set(config.name, task);
    console.log(`📅 Scheduled job: ${config.name} (${config.schedule})`);
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`🛑 Stopped job: ${name}`);
    }
  }

  /**
   * Start a stopped job
   */
  startJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.start();
      console.log(`▶️  Started job: ${name}`);
    }
  }

  /**
   * Stop all jobs
   */
  stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}

export default new CronService();
