'use server'

import { initializeServices } from '../../lib/startup';

export default async function CronInitializer() {
  // Initialize services on server startup
  if (process.env.NODE_ENV === 'test') {
    initializeServices();
  }
  
  // This component doesn't render anything
  return null;
} 