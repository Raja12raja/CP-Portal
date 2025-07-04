import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb';
import Contest from '@/models/Contest';
import Registration from '@/models/Registration';

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const { userId } = params;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        await connectDB();

        const registrations = await Registration.find({ userId });

        if (!registrations.length) {
            return NextResponse.json({ data: [] });
        }

        const contestUrls = registrations.map(reg => reg.contest.url);
        const contests = await Contest.find({ url: { $in: contestUrls } });

        return NextResponse.json({ data: contests });
    } catch (err) {
        console.error('Error fetching registered contests:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


export async function POST(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const { userId, contest } = await request.json();
    console.log('POST request received for registration:', { userId, contest });

    if (!userId || !contest?.url) {
        return NextResponse.json(
            { success: false, error: 'Missing userId or contest data' },
            { status: 400 }
        );
    }

    try {
        await connectDB();

        // Check if contest has already started or ended
        const now = new Date();
        const contestStartTime = new Date(contest.startTime);
        const contestEndTime = new Date(contest.endTime);

        if (now >= contestEndTime) {
            return NextResponse.json({
                success: false,
                error: 'This contest has already ended. Registration is not possible.'
            }, { status: 400 });
        }

        if (now >= contestStartTime) {
            return NextResponse.json({
                success: false,
                error: 'This contest has already started. Registration is not possible.'
            }, { status: 400 });
        }

        // Prevent duplicate registration
        const exists = await Registration.findOne({
            userId,
            'contest.url': contest.url
        });

        if (exists) {
            return NextResponse.json({
                success: true,
                message: 'Already registered'
            });
        }

        const newRegistration = await Registration.create({
            userId,
            contest
        });

        return NextResponse.json({ success: true, data: newRegistration });
    } catch (err) {
        console.error('Error during registration POST:', err);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}