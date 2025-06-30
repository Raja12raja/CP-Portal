import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

// GET - Search users by email
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Search for user by email (case insensitive)
    const user = await User.findOne({ 
      email: { $regex: email, $options: 'i' },
      clerkId: { $ne: userId } // Exclude current user
    }).select('clerkId firstName lastName username imageUrl email').lean();

    if (!user) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'User not found'
      });
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error searching user:', error);
    return NextResponse.json(
      { error: 'Failed to search user' },
      { status: 500 }
    );
  }
} 