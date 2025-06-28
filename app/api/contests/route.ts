import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Contest from '../../../models/Contest';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');
    const upcoming = searchParams.get('upcoming') === 'true';

    let query: any = {};

    // Filter by platform if specified
    if (platform) {
      query.platform = platform;
    }

    // Filter for upcoming contests if requested
    if (upcoming) {
      query.startTime = { $gte: new Date() };
    }

    const contests = await Contest.find(query)
      .sort({ startTime: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: contests,
      count: contests.length,
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contests' },
      { status: 500 }
    );
  }
} 