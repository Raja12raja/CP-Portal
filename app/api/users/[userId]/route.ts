import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../../../../lib/mongodb';
import User, { IUser } from '../../../../models/User';

// GET - Get user profile (only for friends)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const targetUserId = params.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Users can always view their own profile
    if (currentUserId === targetUserId) {
      await dbConnect();
      const user = await User.findOne({ clerkId: targetUserId }).lean();
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: user,
        isOwnProfile: true
      });
    }

    await dbConnect();

    // Check if current user is friends with target user
    const currentUser = await User.findOne({ clerkId: currentUserId }) as IUser | null;
    if (!currentUser || !currentUser.friends?.includes(targetUserId)) {
      return NextResponse.json(
        { error: 'You can only view profiles of your friends' },
        { status: 403 }
      );
    }

    // Get target user's profile (limited information for friends)
    const targetUser = await User.findOne({ clerkId: targetUserId }).lean() as IUser | null;
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return limited profile information for friends
    const friendProfile = {
      clerkId: targetUser.clerkId,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      username: targetUser.username,
      imageUrl: targetUser.imageUrl,
      email: targetUser.email,
      preferences: targetUser.preferences,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: friendProfile,
      isOwnProfile: false
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 