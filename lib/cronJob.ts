import cron from 'node-cron';
import { ContestFetcher } from './contestFetcher';

class CronJobService {
  private static instance: CronJobService;
  private isRunning = false;

  private constructor() {}

  static getInstance(): CronJobService {
    if (!CronJobService.instance) {
      CronJobService.instance = new CronJobService();
    }
    return CronJobService.instance;
  }

  start() {
    if (this.isRunning) {
      console.log('Cron job is already running');
      return;
    }

    console.log('Starting cron job service...');

    // Update contests every 6 hours (at 00:00, 06:00, 12:00, 18:00)
    cron.schedule('0 */6 * * *', async () => {
      console.log('=== Cron Job: Updating contests ===');
      console.log('Time:', new Date().toISOString());
      
      try {
        await ContestFetcher.fetchAllContests();
        console.log('=== Cron Job: Contest update completed successfully ===');
      } catch (error) {
        console.error('=== Cron Job: Error updating contests ===');
        console.error('Error:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Also update contests every hour during peak times (8 AM to 10 PM UTC)
    cron.schedule('0 8-22 * * *', async () => {
      console.log('=== Hourly Cron Job: Updating contests ===');
      console.log('Time:', new Date().toISOString());
      
      try {
        await ContestFetcher.fetchAllContests();
        console.log('=== Hourly Cron Job: Contest update completed successfully ===');
      } catch (error) {
        console.error('=== Hourly Cron Job: Error updating contests ===');
        console.error('Error:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.isRunning = true;
    console.log('Cron job service started successfully');
    console.log('Scheduled tasks:');
    console.log('- Contest updates every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)');
    console.log('- Contest updates every hour from 8 AM to 10 PM UTC');
  }

  stop() {
    if (!this.isRunning) {
      console.log('Cron job is not running');
      return;
    }

    cron.getTasks().forEach(task => task.stop());
    this.isRunning = false;
    console.log('Cron job service stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      tasks: Array.from(cron.getTasks().entries()).map(([name]) => ({
        name,
        running: true
      }))
    };
  }
}

export default CronJobService; 