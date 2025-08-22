// File: /api/users/[userId]/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import UserFavorite from '../../../../../models/UserFavorite';

// GET - Fetch user's favorite problems
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        await dbConnect();
        const { userId } = params;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        const favorites = await UserFavorite.find({ userId }).lean();

        return NextResponse.json({
            success: true,
            data: favorites,
            count: favorites.length,
        });
    } catch (error) {
        console.error('Error fetching user favorites:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch favorites' },
            { status: 500 }
        );
    }
}

// POST - Add a problem to favorites
export async function POST(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        await dbConnect();
        const { userId } = params;
        const { problemId } = await request.json();

        if (!userId || !problemId) {
            return NextResponse.json(
                { success: false, error: 'User ID and Problem ID are required' },
                { status: 400 }
            );
        }

        // Check if already favorited
        const existingFavorite = await UserFavorite.findOne({ userId, problemId });
        if (existingFavorite) {
            return NextResponse.json(
                { success: false, error: 'Problem is already in favorites' },
                { status: 409 }
            );
        }

        // Add to favorites
        const favorite = new UserFavorite({
            userId,
            problemId,
            createdAt: new Date(),
        });

        await favorite.save();

        return NextResponse.json({
            success: true,
            data: favorite,
            message: 'Problem added to favorites successfully',
        });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add to favorites' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a problem from favorites
export async function DELETE(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        await dbConnect();
        const { userId } = params;
        const { problemId } = await request.json();

        if (!userId || !problemId) {
            return NextResponse.json(
                { success: false, error: 'User ID and Problem ID are required' },
                { status: 400 }
            );
        }

        const deletedFavorite = await UserFavorite.findOneAndDelete({ userId, problemId });

        if (!deletedFavorite) {
            return NextResponse.json(
                { success: false, error: 'Favorite not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Problem removed from favorites successfully',
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove from favorites' },
            { status: 500 }
        );
    }
}