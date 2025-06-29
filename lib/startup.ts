import CronJobService from './cronJob';

export function initializeServices() {
  console.log('=== Initializing Services ===');
  
  // Start the cron job service
  try {
    const cronService = CronJobService.getInstance();
    cronService.start();
    console.log('✅ Cron job service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize cron job service:', error);
  }
  
  console.log('=== Services Initialization Complete ===');
} 