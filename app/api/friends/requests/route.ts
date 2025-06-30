import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../../../../lib/mongodb';
import User, { IUser } from '../../../../models/User';

// PUT - Accept or decline friend request
export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'Target user ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "decline"' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if friend request exists
    const currentUser = await User.findOne({ clerkId: userId }) as IUser | null;
    if (!currentUser || !currentUser.friendRequests?.received?.includes(targetUserId)) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Add to friends for both users
      await User.findOneAndUpdate(
        { clerkId: userId },
        { 
          $addToSet: { friends: targetUserId },
          $pull: { 'friendRequests.received': targetUserId }
        }
      );

      await User.findOneAndUpdate(
        { clerkId: targetUserId },
        { 
          $addToSet: { friends: userId },
          $pull: { 'friendRequests.sent': userId }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Friend request accepted successfully'
      });
    } else {
      // Decline - remove from received requests for current user
      await User.findOneAndUpdate(
        { clerkId: userId },
        { 
          $pull: { 'friendRequests.received': targetUserId }
        }
      );

      // Remove from sent requests for target user
      await User.findOneAndUpdate(
        { clerkId: targetUserId },
        { 
          $pull: { 'friendRequests.sent': userId }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Friend request declined successfully'
      });
    }
  } catch (error) {
    console.error('Error handling friend request:', error);
    return NextResponse.json(
      { error: 'Failed to handle friend request' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel sent friend request
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if friend request was sent
    const currentUser = await User.findOne({ clerkId: userId }) as IUser | null;
    if (!currentUser || !currentUser.friendRequests?.sent?.includes(targetUserId)) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Remove from sent requests for current user
    await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        $pull: { 'friendRequests.sent': targetUserId }
      }
    );

    // Remove from received requests for target user
    await User.findOneAndUpdate(
      { clerkId: targetUserId },
      { 
        $pull: { 'friendRequests.received': userId }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Friend request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel friend request' },
      { status: 500 }
    );
  }
} 