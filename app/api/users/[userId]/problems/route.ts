import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserProblem from '@/models/UserProblem';
import Problem from '@/models/Problem';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const difficulty = searchParams.get('difficulty');

    let query: any = { userId };

    if (platform && platform !== 'all') {
      query.platform = platform;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    const userProblems = await UserProblem.find(query).sort({ updatedAt: -1 });

    // Get problem details for each user problem
    const problemIds = userProblems.map(up => up.problemId);
    const problems = await Problem.find({ problemId: { $in: problemIds } });

    // Create a map of problem details
    const problemMap = new Map(problems.map(p => [p.problemId, p]));

    // Combine user problems with problem details
    const enrichedProblems = userProblems.map(userProblem => {
      const problem = problemMap.get(userProblem.problemId);
      return {
        ...userProblem.toObject(),
        problem: problem || null,
      };
    });

    return NextResponse.json({ 
      success: true,
      data: enrichedProblems 
    });
  } catch (err) {
    console.error('Error fetching user problems:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const body = await request.json();

  if (!userId || !body.problemId) {
    return NextResponse.json(
      { success: false, error: 'Missing userId or problemId' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Get problem details
    const problem = await Problem.findOne({ problemId: body.problemId });
    if (!problem) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Update or create user problem
    const userProblem = await UserProblem.findOneAndUpdate(
      { userId, problemId: body.problemId },
      {
        userId,
        problemId: body.problemId,
        platform: problem.platform,
        status: body.status || 'not_started',
        submissionCount: body.submissionCount || 0,
        bestSubmissionTime: body.bestSubmissionTime,
        bestSubmissionMemory: body.bestSubmissionMemory,
        lastAttempted: new Date(),
        solvedAt: body.status === 'solved' || body.status === 'solved_optimally' ? new Date() : undefined,
        notes: body.notes,
        rating: body.rating,
        tags: body.tags,
        difficulty: problem.difficulty,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      success: true, 
      data: userProblem 
    });
  } catch (err) {
    console.error('Error updating user problem:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 