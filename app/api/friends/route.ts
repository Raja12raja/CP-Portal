import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/mongodb';
import User, { IUser } from '../../../models/User';

// GET - Get friends list and friend requests
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const user = await User.findOne({ clerkId: userId }).lean() as IUser | null;
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get friends details
    const friends = await User.find({ 
      clerkId: { $in: user.friends || [] } 
    }).select('clerkId firstName lastName username imageUrl email').lean();

    // Get sent friend requests details
    const sentRequests = await User.find({ 
      clerkId: { $in: user.friendRequests?.sent || [] } 
    }).select('clerkId firstName lastName username imageUrl email').lean();

    // Get received friend requests details
    const receivedRequests = await User.find({ 
      clerkId: { $in: user.friendRequests?.received || [] } 
    }).select('clerkId firstName lastName username imageUrl email').lean();

    return NextResponse.json({
      success: true,
      data: {
        friends,
        sentRequests,
        receivedRequests
      }
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends data' },
      { status: 500 }
    );
  }
}

// POST - Send friend request
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if target user exists
    const targetUser = await User.findOne({ clerkId: targetUserId });
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if already friends
    const currentUser = await User.findOne({ clerkId: userId });
    if (currentUser?.friends?.includes(targetUserId)) {
      return NextResponse.json(
        { error: 'Already friends with this user' },
        { status: 400 }
      );
    }

    // Check if friend request already sent
    if (currentUser?.friendRequests?.sent?.includes(targetUserId)) {
      return NextResponse.json(
        { error: 'Friend request already sent' },
        { status: 400 }
      );
    }

    // Check if friend request already received
    if (currentUser?.friendRequests?.received?.includes(targetUserId)) {
      return NextResponse.json(
        { error: 'Friend request already received from this user' },
        { status: 400 }
      );
    }

    // Add to sent requests for current user
    await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        $addToSet: { 
          'friendRequests.sent': targetUserId 
        } 
      }
    );

    // Add to received requests for target user
    await User.findOneAndUpdate(
      { clerkId: targetUserId },
      { 
        $addToSet: { 
          'friendRequests.received': userId 
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
} 