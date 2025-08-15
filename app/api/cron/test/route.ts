import { NextRequest, NextResponse } from 'next/server';
import { ContestFetcher } from '../../../../lib/contestFetcher';
import CronJobService from '../../../../lib/cronJob';
import { ProblemFetcher } from '../../../../lib/problemFetcher';

export async function GET() {
  try {
    const cronService = CronJobService.getInstance();
    const status = cronService.getStatus();
    
    return NextResponse.json({
      success: true,
      cronStatus: status,
      message: 'Cron job status and manual test endpoint'
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get cron status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('===Fetch Test ===');
    console.log('Time:', new Date().toISOString());
    
    // Manually trigger contest fetching
    await ContestFetcher.fetchAllContests();
    await ProblemFetcher.fetchAllProblems();
    
    return NextResponse.json({
      success: true,
      message: 'github action completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== github action Fetch Error ===');
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 