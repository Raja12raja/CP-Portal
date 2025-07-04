import cron from 'node-cron';
import { ContestFetcher } from './contestFetcher';
import { ProblemFetcher } from './problemFetcher';

class CronJobService {
  private static instance: CronJobService;
  private isRunning = false;
  private task: cron.ScheduledTask | null = null;

  private constructor() {
    console.log('CronJobService constructor called');
  }

  static getInstance(): CronJobService {
    if (!CronJobService.instance) {
      console.log('Creating new CronJobService instance');
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
    console.log('Current time:', new Date().toISOString());

    // Update contests every minute
    this.task = cron.schedule('* * * * *', async () => {
      console.log('=== Cron Job: Updating  ===');
      console.log('Time:', new Date().toISOString());
      
      try {
        await ContestFetcher.fetchAllContests();
        await ProblemFetcher.fetchAllProblems();
        console.log('=== Cron Job: update completed successfully ===');
      } catch (error) {
        console.error('=== Cron Job: Error updating  ===');
        console.error('Error:', error);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.isRunning = true;
    console.log('Cron job service started successfully');
    console.log('Scheduled tasks:');
    console.log('Task created:', !!this.task);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Cron job is not running');
      return;
    }

    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    
    cron.getTasks().forEach(task => task.stop());
    this.isRunning = false;
    console.log('Cron job service stopped');
  }

  getStatus() {
    const tasks = Array.from(cron.getTasks().entries()).map(([name, task]) => ({
      name,
      running: true
    }));
    
    return {
      isRunning: this.isRunning,
      taskExists: !!this.task,
      totalTasks: tasks.length,
      tasks
    };
  }
}

export default CronJobService; 