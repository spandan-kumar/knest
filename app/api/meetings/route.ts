import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MeetingService } from '@/lib/services/meeting.service';
import type { CreateMeetingRequest } from '@/lib/services/meeting.service';
import { meetingListQuerySchema } from '@/lib/validations/schemas';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, fileName, fileSize, duration, analysisResult } = body;

    if (!title || !analysisResult) {
      return NextResponse.json(
        { error: 'Title and analysisResult are required' },
        { status: 400 }
      );
    }

    const createRequest: CreateMeetingRequest = {
      userId: session.user.id,
      title,
      fileName,
      fileSize,
      duration,
      analysisResult,
    };

    const meeting = await MeetingService.createMeeting(createRequest);

    return NextResponse.json({
      id: meeting.id,
      title: meeting.title,
      createdAt: meeting.createdAt,
      summary: meeting.analysisResult.summary,
      taskCount: meeting.analysisResult.tasks.length,
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    // Validate and parse query params
    const validatedParams = meetingListQuerySchema.parse(queryParams);

    const result = await MeetingService.getMeetingsByUserId(
      session.user.id,
      validatedParams
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get meetings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}