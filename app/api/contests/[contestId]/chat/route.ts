import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import ChatMessage from '../../../../../models/ChatMessage';
import { auth } from '@clerk/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { contestId: string } }
) {
  try {
    await dbConnect();
    const { contestId } = params;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    let query: any = { contestId, isDeleted: false };

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      count: messages.length,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { contestId } = params;
    const { message, username, userImage } = await request.json();

    if (!message || !username) {
      return NextResponse.json(
        { success: false, error: 'Message and username are required' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    const chatMessage = new ChatMessage({
      contestId,
      userId,
      username,
      userImage,
      message,
      timestamp: new Date(),
    });

    await chatMessage.save();

    return NextResponse.json({
      success: true,
      data: chatMessage,
    });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chat message' },
      { status: 500 }
    );
  }
}
