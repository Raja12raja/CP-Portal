import { NextRequest, NextResponse } from 'next/server';
import { ProblemFetcher } from '../../../../lib/problemFetcher';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Problem Update Started ===');
    
    // Check if the request is authorized (you might want to add authentication here)
    const authHeader = request.headers.get('authorization');
    
    // For now, we'll allow the request to proceed
    // In production, you should implement proper authentication
    
    console.log('Starting problem fetch from all platforms...');
    await ProblemFetcher.fetchAllProblems();
    
    console.log('=== Problem Update Completed ===');
    
    return NextResponse.json({
      success: true,
      message: 'Problems updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== Problem Update Error ===');
    console.error('Error updating problems:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update problems',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Problem update endpoint is ready',
    status: 'ready',
    timestamp: new Date().toISOString()
  });
} 