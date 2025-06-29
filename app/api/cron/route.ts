import { NextRequest, NextResponse } from 'next/server';
import CronJobService from '../../../lib/cronJob';

export async function GET() {
  try {
    const cronService = CronJobService.getInstance();
    const status = cronService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
      message: 'Cron job status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cron job status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get cron job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const cronService = CronJobService.getInstance();
    
    switch (action) {
      case 'start':
        cronService.start();
        return NextResponse.json({
          success: true,
          message: 'Cron job started successfully'
        });
        
      case 'stop':
        cronService.stop();
        return NextResponse.json({
          success: true,
          message: 'Cron job stopped successfully'
        });
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Use "start" or "stop"' 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to manage cron job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 