import { NextRequest, NextResponse } from 'next/server';
import { ContestFetcher } from '../../../../lib/contestFetcher';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Contest Update Started ===');
    
    // Check if the request is authorized (you might want to add authentication here)
    const authHeader = request.headers.get('authorization');
    
    // For now, we'll allow the request to proceed
    // In production, you should implement proper authentication
    
    console.log('Starting contest fetch from all platforms...');
    await ContestFetcher.fetchAllContests();
    
    console.log('=== Contest Update Completed ===');
    
    return NextResponse.json({
      success: true,
      message: 'Contests updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== Contest Update Error ===');
    console.error('Error updating contests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update contests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Contest update endpoint is ready',
    status: 'ready',
    timestamp: new Date().toISOString()
  });
} 