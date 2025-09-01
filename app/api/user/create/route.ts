// app/api/user/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('=== User Creation Debug ===');

    const { userId } = auth();
    console.log('User ID from auth:', userId);

    if (!userId) {
      console.log('No user ID found - user not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in first' },
        { status: 401 }
      );
    }

    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');

    // Get complete user data from Clerk
    const user = await currentUser();
    console.log('Clerk user data:', {
      userId: user?.id,
      email: user?.emailAddresses?.[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      username: user?.username,
      imageUrl: user?.imageUrl
    });

    const userDataToSave = {
      clerkId: userId,
      email: user?.emailAddresses?.[0]?.emailAddress || 'unknown@example.com',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      imageUrl: user?.imageUrl || '',
      preferences: {
        emailNotifications: false,
        reminders: true
      },
      userLinks: {
        codeforces: '',
        codechef: '',
        leetcode: ''
      },
      friends: [],
      friendRequests: {
        sent: [],
        received: []
      }
    };

    console.log('Saving user data:', userDataToSave);

    // Create or update user in database
    const userData = await User.findOneAndUpdate(
      { clerkId: userId },
      userDataToSave,
      { upsert: true, new: true, lean: true }
    );

    console.log('Database operation completed');
    console.log('User data returned:', userData);

    if (userData && typeof userData === 'object' && 'email' in userData) {
      console.log('User created/updated successfully:', (userData as any).email);
      console.log('UserLinks initialized:', (userData as any).userLinks);
    } else {
      console.log('User data is null or invalid');
    }

    return NextResponse.json({
      success: true,
      message: 'User created/updated successfully',
      data: userData,
      debug: {
        userId,
        email: user?.emailAddresses?.[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
        userLinksInitialized: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('=== User Creation Error ===');
    console.error('Error creating user:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          timestamp: new Date().toISOString(),
          errorType: error?.constructor?.name
        }
      },
      { status: 500 }
    );
  }
}

// Add GET method for testing authentication
export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        message: 'Please sign in first'
      });
    }

    const user = await currentUser();

    return NextResponse.json({
      authenticated: true,
      userId,
      userData: {
        email: user?.emailAddresses?.[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        imageUrl: user?.imageUrl
      },
      message: 'You are authenticated. Use POST to create user.'
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Authentication check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}