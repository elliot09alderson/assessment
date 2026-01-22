import cron from 'node-cron';
import { syncService } from '../services/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the scheduled sync job
 */
export function startSyncScheduler(): void {
  if (scheduledTask) {
    logger.warn('Sync scheduler is already running');
    return;
  }

  logger.info('Starting sync scheduler', { cron: config.sync.intervalCron });

  scheduledTask = cron.schedule(config.sync.intervalCron, async () => {
    try {
      logger.info('Running scheduled shipment synchronization');
      const result = await syncService.syncAllShipments();
      logger.info('Scheduled sync completed', {
        processed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
      });
    } catch (error) {
      logger.error('Scheduled sync failed', { error: (error as Error).message });
    }
  });

  logger.info('Sync scheduler started successfully');
}

/**
 * Stop the scheduled sync job
 */
export function stopSyncScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Sync scheduler stopped');
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return scheduledTask !== null;
}
