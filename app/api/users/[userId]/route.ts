// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUserId = params.userId;
    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    try {
      await dbConnect();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    // ✅ Properly typed queries
    const [currentUser, targetUser] = await Promise.all([
      User.findOne({ clerkId: currentUserId }).lean<IUser>().exec(),
      User.findOne({ clerkId: targetUserId }).lean<IUser>().exec(),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If viewing own profile
    if (currentUserId === targetUserId) {
      return NextResponse.json({
        success: true,
        data: targetUser,
        isOwnProfile: true,
      });
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    // ✅ Type-safe friendship check
    const areFriends = currentUser.friends.includes(targetUserId);

    if (!areFriends) {
      return NextResponse.json(
        { error: "You can only view profiles of your friends" },
        { status: 403 }
      );
    }

    // ✅ Type-safe friend profile response
    const friendProfile = {
      clerkId: targetUser.clerkId,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      username: targetUser.username,
      imageUrl: targetUser.imageUrl,
      preferences: {
        codeforces: targetUser.preferences.codeforces,
        codechef: targetUser.preferences.codechef,
        leetcode: targetUser.preferences.leetcode,
        geeksforgeeks: targetUser.preferences.geeksforgeeks,
        emailNotifications: targetUser.preferences.emailNotifications,
        reminders: targetUser.preferences.reminders,
      },
      userLinks: targetUser.userLinks,
      codeforcesStats: targetUser.codeforcesStats ?? null,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: friendProfile,
      isOwnProfile: false,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
