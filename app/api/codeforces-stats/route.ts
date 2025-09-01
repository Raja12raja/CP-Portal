// app/api/codeforces-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

interface CodeforcesStats {
    rating: number | null;
    rank: string | null;
    maxRank: string | null;
    maxRating: number | null;
    problemsSolved: number;
    contestsParticipated: number;
    username: string;
    lastUpdated: Date;
}

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
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get user data to check if they have cached stats
        const userData = await User.findOne({ clerkId: userId });
        if (!userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if we have cached stats and if they're recent (less than 1 hour old)
        const cachedStats = userData.codeforcesStats;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (cachedStats &&
            cachedStats.username === username &&
            cachedStats.lastUpdated &&
            new Date(cachedStats.lastUpdated) > oneHourAgo) {

            return NextResponse.json({
                success: true,
                data: cachedStats,
                cached: true,
                lastUpdated: cachedStats.lastUpdated
            });
        }

        // Fetch fresh data from Codeforces API
        const freshStats = await fetchCodeforcesData(username);

        if (!freshStats) {
            return NextResponse.json(
                { error: 'Failed to fetch data from Codeforces API or user not found' },
                { status: 404 }
            );
        }

        // Save fresh stats to user document
        await User.findOneAndUpdate(
            { clerkId: userId },
            {
                codeforcesStats: {
                    ...freshStats,
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            data: { ...freshStats, lastUpdated: new Date() },
            cached: false,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('Error in codeforces-stats API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Force fetch fresh data
        const freshStats = await fetchCodeforcesData(username);

        if (!freshStats) {
            return NextResponse.json(
                { error: 'Failed to fetch data from Codeforces API or user not found' },
                { status: 404 }
            );
        }

        // Save fresh stats to user document
        const updatedUser = await User.findOneAndUpdate(
            { clerkId: userId },
            {
                codeforcesStats: {
                    ...freshStats,
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { ...freshStats, lastUpdated: new Date() },
            cached: false,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('Error in codeforces-stats POST API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function fetchCodeforcesData(username: string): Promise<CodeforcesStats | null> {
    try {
        console.log(`Fetching Codeforces data for: ${username}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch user info
        const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);

        if (!userResponse.ok) {
            console.error(`Codeforces API error: ${userResponse.status}`);
            return null;
        }

        const userData = await userResponse.json();
        console.log('User data response:', userData);

        if (userData.status !== "OK") {
            console.error('Codeforces user info error:', userData);
            return null;
        }

        // Add another delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch user submissions (limit to recent submissions for better performance)
        const statusResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=5000`);

        if (!statusResponse.ok) {
            console.error(`Codeforces submissions API error: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();

        let stats: CodeforcesStats = {
            rating: null,
            rank: null,
            maxRank: null,
            maxRating: null,
            problemsSolved: 0,
            contestsParticipated: 0,
            username: username,
            lastUpdated: new Date()
        };

        // Process user info
        if (userData.result && userData.result.length > 0) {
            const info = userData.result[0];
            stats.rating = info.rating || null;
            stats.rank = info.rank || null;
            stats.maxRank = info.maxRank || null;
            stats.maxRating = info.maxRating || null;
        }

        // Process submissions if available
        if (statusData.status === "OK" && statusData.result) {
            const solvedProblems = new Set<string>();
            const contests = new Set<number>();

            statusData.result.forEach((submission: any) => {
                // Count solved problems (only accepted submissions)
                if (submission.verdict === "OK") {
                    const problemId = `${submission.problem.contestId}-${submission.problem.index}`;
                    solvedProblems.add(problemId);
                }

                // Count contest participation (only official contest submissions)
                if (submission.author.participantType === "CONTESTANT") {
                    contests.add(submission.problem.contestId);
                }
            });

            stats.problemsSolved = solvedProblems.size;
            stats.contestsParticipated = contests.size;
        }

        console.log('Final stats:', stats);
        return stats;

    } catch (error) {
        console.error('Error fetching Codeforces data:', error);
        return null;
    }
}