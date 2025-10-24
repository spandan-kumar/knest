import { NextRequest, NextResponse } from 'next/server';
import { SharedMeetingService } from '@/lib/services/shared-meeting.service';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const meeting = await SharedMeetingService.getMeetingByToken(params.token);

    if (!meeting) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    // Get who shared it
    const sharedBy = await SharedMeetingService.getSharedBy(params.token);

    return NextResponse.json({
      meeting,
      sharedBy,
    });
  } catch (error) {
    console.error('Get shared meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared meeting' },
      { status: 500 }
    );
  }
}
