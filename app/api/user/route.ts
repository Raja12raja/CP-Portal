import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

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
    console.log(userId);
    const user = await User.findOne({ clerkId: userId }).lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

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
    const { preferences, userLinks } = body;

    await dbConnect();

    // Build update object dynamically
    const updateData: any = {};

    if (preferences) {
      updateData.preferences = preferences;
    }

    if (userLinks) {
      // Ensure userLinks are properly trimmed and saved
      updateData.userLinks = {
        codeforces: userLinks.codeforces?.trim() || '',
        codechef: userLinks.codechef?.trim() || '',
        leetcode: userLinks.leetcode?.trim() || '',
      };
    }

    console.log('Updating user with data:', updateData);

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      updateData,
      { new: true, lean: true, upsert: false }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Updated user:', updatedUser);

    return NextResponse.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}