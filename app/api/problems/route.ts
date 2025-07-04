import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Problem from '../../../models/Problem';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const sortBy = searchParams.get('sortBy') || 'title';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const premium = searchParams.get('premium');
    const rated = searchParams.get('rated');

    let query: any = {};

    // Filter by platform
    if (platform && platform !== 'all') {
      query.platform = platform;
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by tag
    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by premium status
    if (premium !== null && premium !== undefined) {
      query.isPremium = premium === 'true';
    }

    // Filter by rated status
    if (rated !== null && rated !== undefined) {
      query.isRated = rated === 'true';
    }

    // Build sort object
    let sort: any = {};
    if (sortBy === 'acceptanceRate') {
      sort.acceptanceRate = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'difficulty') {
      sort.difficulty = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'title') {
      sort.title = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'lastUpdated') {
      sort.lastUpdated = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.title = 1; // Default sort
    }

    const problems = await Problem.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Problem.countDocuments(query);

    // Get unique categories and tags for filters
    const categories = await Problem.distinct('category', query);
    const tags = await Problem.distinct('tags', query);

    return NextResponse.json({
      success: true,
      data: problems,
      count: problems.length,
      totalCount,
      pagination: {
        skip,
        limit,
        hasMore: skip + limit < totalCount,
      },
      filters: {
        categories: categories.filter(Boolean).sort(),
        tags: tags.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problems' },
      { status: 500 }
    );
  }
} 